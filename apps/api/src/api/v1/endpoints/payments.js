// Payment endpoints - Stripe subscription handling
// Routes: POST /create-checkout-session, POST /webhook, GET /subscription

import { Router } from "express";
import Stripe from "stripe";
import { config } from "../../../core/config.js";
import { query } from "../../../core/database.js";
import { requireUser } from "../../../core/security.js";

const router = Router();

const stripe = config.STRIPE_SECRET_KEY
  ? new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
    })
  : null;

// Map plan IDs to Stripe price IDs
const PLAN_PRICE_MAP = {
  pro: config.STRIPE_PRICE_PRO_MONTHLY,
  teams: config.STRIPE_PRICE_TEAMS_MONTHLY,
};

const requireStripe = (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payment system not configured" });
  }
  next();
};

// ─── POST /create-checkout-session ───────────────────────────
router.post(
  "/create-checkout-session",
  requireUser,
  requireStripe,
  async (req, res, next) => {
    try {
      const { planId } = req.body;
      const userId = req.userId;
      const user = req.user;

      // Validate plan
      if (!planId || !["pro", "teams"].includes(planId)) {
        return res
          .status(400)
          .json({ error: 'Invalid plan. Must be "pro" or "teams"' });
      }

      const priceId = PLAN_PRICE_MAP[planId];
      if (!priceId) {
        return res
          .status(400)
          .json({ error: "Price ID not configured for this plan" });
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;

        // Save the customer ID to the database
        await query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [
          customerId,
          userId,
        ]);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${config.FRONTEND_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.FRONTEND_URL}/pricing?canceled=true`,
        metadata: {
          userId: userId,
          planId: planId,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            planId: planId,
          },
        },
      });

      return res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      next(err);
    }
  },
);

// ─── POST /create-portal-session ─────────────────────────────
router.post(
  "/create-portal-session",
  requireUser,
  requireStripe,
  async (req, res, next) => {
    try {
      const userId = req.userId;

      // Get the user's Stripe customer ID
      const { rows } = await query(
        "SELECT stripe_customer_id FROM users WHERE id = $1",
        [userId],
      );

      const customerId = rows[0]?.stripe_customer_id;
      if (!customerId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${config.FRONTEND_URL}/profile`,
      });

      return res.json({
        url: session.url,
      });
    } catch (err) {
      console.error("Error creating portal session:", err);
      next(err);
    }
  },
);

// ─── GET /subscription ─────────────────────────────────────────
router.get(
  "/subscription",
  requireUser,
  requireStripe,
  async (req, res, next) => {
    try {
      const userId = req.userId;

      // Get user's subscription data from database
      const { rows } = await query(
        `SELECT stripe_customer_id, stripe_subscription_id, subscription_status,
              subscription_plan, subscription_current_period_end, plan,
              analyses_used, analyses_limit
       FROM users
       WHERE id = $1`,
        [userId],
      );

      const userData = rows[0];
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }

      // If we have a Stripe subscription, get live data from Stripe
      let stripeData = null;
      if (userData.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            userData.stripe_subscription_id,
          );
          stripeData = {
            status: subscription.status,
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          };
        } catch (stripeErr) {
          console.error("Error fetching Stripe subscription:", stripeErr);
          // Continue with database data if Stripe fetch fails
        }
      }

      return res.json({
        subscription: {
          status:
            stripeData?.status || userData.subscription_status || "inactive",
          plan: userData.subscription_plan || userData.plan || "free",
          currentPeriodEnd:
            stripeData?.currentPeriodEnd ||
            userData.subscription_current_period_end,
          cancelAtPeriodEnd: stripeData?.cancelAtPeriodEnd || false,
        },
        usage: {
          analysesUsed: userData.analyses_used,
          analysesLimit: userData.analyses_limit,
        },
        hasCustomerId: !!userData.stripe_customer_id,
      });
    } catch (err) {
      console.error("Error fetching subscription:", err);
      next(err);
    }
  },
);

// ─── POST /webhook ────────────────────────────────────────────
// This endpoint handles Stripe webhooks
// Note: This must be registered before express.json() middleware in the main app
router.post("/webhook", async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    const payload = req.body;

    if (!sig || !config.STRIPE_WEBHOOK_SECRET) {
      return res
        .status(400)
        .json({ error: "Missing signature or webhook secret" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err);
    next(err);
  }
});

// ─── Webhook Handlers ───────────────────────────────────────

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const subscriptionId = session.subscription;

  if (!userId || !subscriptionId) {
    console.error("Missing userId or subscriptionId in checkout session");
    return;
  }

  try {
    // Update user's subscription in database
    await query(
      `UPDATE users
       SET stripe_subscription_id = $1,
           subscription_plan = $2,
           subscription_status = 'active',
           plan = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [subscriptionId, planId, userId],
    );

    console.log(`Subscription ${subscriptionId} created for user ${userId}`);
  } catch (err) {
    console.error("Error updating subscription after checkout:", err);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  try {
    // Get the subscription to find the user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (userId) {
      await query(
        `UPDATE users
         SET subscription_status = 'active',
             subscription_current_period_end = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [new Date(subscription.current_period_end * 1000), userId],
      );
    }
  } catch (err) {
    console.error("Error handling invoice payment succeeded:", err);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  try {
    // Get the subscription to find the user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (userId) {
      await query(
        `UPDATE users
         SET subscription_status = 'past_due',
             updated_at = NOW()
         WHERE id = $1`,
        [userId],
      );
    }
  } catch (err) {
    console.error("Error handling invoice payment failed:", err);
  }
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  try {
    await query(
      `UPDATE users
       SET subscription_status = $1,
           subscription_current_period_end = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [
        subscription.status,
        new Date(subscription.current_period_end * 1000),
        userId,
      ],
    );
  } catch (err) {
    console.error("Error handling subscription update:", err);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  try {
    await query(
      `UPDATE users
       SET subscription_status = 'canceled',
           stripe_subscription_id = NULL,
           subscription_plan = NULL,
           plan = 'free',
           updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );

    console.log(`Subscription cancelled for user ${userId}`);
  } catch (err) {
    console.error("Error handling subscription deletion:", err);
  }
}

export default router;

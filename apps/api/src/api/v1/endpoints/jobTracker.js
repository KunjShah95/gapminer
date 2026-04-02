import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { query } from "../../../core/database.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      company,
      role,
      status,
      salary,
      location,
      jobUrl,
      notes,
      appliedDate,
    } = req.body;

    const validStatuses = [
      "saved",
      "applied",
      "screening",
      "interview",
      "offer",
      "rejected",
      "accepted",
    ];
    if (status && !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
    }

    const result = await query(
      `INSERT INTO job_applications (id, user_id, company, role, status, salary, location, job_url, notes, applied_date, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        company,
        role,
        status || "saved",
        salary || null,
        location || null,
        jobUrl || null,
        notes || null,
        appliedDate || new Date(),
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create job application error:", err);
    res.status(500).json({ error: "Failed to create job application" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { status, search } = req.query;

    let sql = "SELECT * FROM job_applications WHERE user_id = $1";
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (company ILIKE $${paramIndex} OR role ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += " ORDER BY created_at DESC";

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Get job applications error:", err);
    res.status(500).json({ error: "Failed to fetch job applications" });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const { rows } = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'applied') as applied,
         COUNT(*) FILTER (WHERE status = 'screening') as screening,
         COUNT(*) FILTER (WHERE status = 'interview') as interview,
         COUNT(*) FILTER (WHERE status = 'offer') as offer,
         COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
         ROUND(AVG(CASE WHEN status IN ('interview', 'offer', 'accepted') THEN 1.0 ELSE 0.0 END) * 100, 1) as interview_rate
       FROM job_applications 
       WHERE user_id = $1`,
      [userId],
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const { rows } = await query(
      "SELECT * FROM job_applications WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (!rows[0])
      return res.status(404).json({ error: "Application not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get application error:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      company,
      role,
      status,
      salary,
      location,
      jobUrl,
      notes,
      appliedDate,
    } = req.body;

    const validStatuses = [
      "saved",
      "applied",
      "screening",
      "interview",
      "offer",
      "rejected",
      "accepted",
    ];
    if (status && !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (company !== undefined) {
      updates.push(`company = $${paramIndex}`);
      values.push(company);
      paramIndex++;
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    if (salary !== undefined) {
      updates.push(`salary = $${paramIndex}`);
      values.push(salary);
      paramIndex++;
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(location);
      paramIndex++;
    }
    if (jobUrl !== undefined) {
      updates.push(`job_url = $${paramIndex}`);
      values.push(jobUrl);
      paramIndex++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }
    if (appliedDate !== undefined) {
      updates.push(`applied_date = $${paramIndex}`);
      values.push(appliedDate);
      paramIndex++;
    }

    if (updates.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const { rows } = await query(
      `UPDATE job_applications SET ${updates.join(", ")} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values,
    );

    if (!rows[0])
      return res.status(404).json({ error: "Application not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const { rowCount } = await query(
      "DELETE FROM job_applications WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (rowCount === 0)
      return res.status(404).json({ error: "Application not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default router;

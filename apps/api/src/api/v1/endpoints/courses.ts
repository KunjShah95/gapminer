import { Router } from "express";
import { prisma } from "../../../core/database.js";
import { requireUser } from "../../../core/security.js";
import { query } from "../../../core/database.js";

const router = Router();

async function requireAdmin(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT role FROM users WHERE id = $1 AND is_active = TRUE",
      [req.userId],
    );
    if (!rows[0] || rows[0].role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

const SEED_COURSES = [
  {
    title: "React - The Complete Guide",
    provider: "Udemy",
    url: "https://www.udemy.com/course/react-the-complete-guide",
    price: "$84.99",
    rating: 4.7,
    ratingCount: 285000,
    category: "Frontend",
    skills: ["React", "JavaScript", "TypeScript", "Redux", "Next.js"],
    description: "Dive in and learn React from scratch! Learn React, Hooks, Redux, React Router, Next.js, and more.",
    imageUrl: "",
    duration: "48 hours",
    level: "Beginner",
  },
  {
    title: "Meta Front-End Developer Professional Certificate",
    provider: "Coursera",
    url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    price: "Subscription",
    rating: 4.7,
    ratingCount: 45000,
    category: "Frontend",
    skills: ["React", "JavaScript", "HTML", "CSS", "Version Control"],
    description: "Launch your career as a front-end developer. Build job-ready skills for an entry-level front-end developer role.",
    imageUrl: "",
    duration: "7 months",
    level: "Beginner",
  },
  {
    title: "Learning TypeScript",
    provider: "LinkedIn Learning",
    url: "https://www.linkedin.com/learning/learning-typescript",
    price: "Subscription",
    rating: 4.5,
    ratingCount: 12000,
    category: "Frontend",
    skills: ["TypeScript", "JavaScript"],
    description: "Learn the essentials of TypeScript, a superset of JavaScript that adds static typing to the language.",
    imageUrl: "",
    duration: "2 hours",
    level: "Intermediate",
  },
  {
    title: "Node.js, Express, MongoDB & More: The Complete Bootcamp",
    provider: "Udemy",
    url: "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp",
    price: "$84.99",
    rating: 4.7,
    ratingCount: 185000,
    category: "Backend",
    skills: ["Node.js", "Express", "MongoDB", "REST APIs", "JWT"],
    description: "Master Node by building a real-world RESTful API and web app with authentication, security, and more.",
    imageUrl: "",
    duration: "42 hours",
    level: "Beginner",
  },
  {
    title: "PostgreSQL for Everybody Specialization",
    provider: "Coursera",
    url: "https://www.coursera.org/specializations/postgresql-for-everybody",
    price: "Subscription",
    rating: 4.6,
    ratingCount: 22000,
    category: "Backend",
    skills: ["PostgreSQL", "SQL", "Database Design", "Python"],
    description: "Learn PostgreSQL from the ground up. Master SQL queries, database design, and advanced PostgreSQL features.",
    imageUrl: "",
    duration: "4 months",
    level: "Beginner",
  },
  {
    title: "Advanced SQL for Data Analysis",
    provider: "LinkedIn Learning",
    url: "https://www.linkedin.com/learning/advanced-sql-for-data-analysis",
    price: "Subscription",
    rating: 4.4,
    ratingCount: 8500,
    category: "Backend",
    skills: ["SQL", "PostgreSQL", "Data Analysis"],
    description: "Take your SQL skills beyond SELECT and JOIN. Learn window functions, CTEs, and query optimization.",
    imageUrl: "",
    duration: "3 hours",
    level: "Advanced",
  },
  {
    title: "Docker Mastery: with Kubernetes +Swarm",
    provider: "Udemy",
    url: "https://www.udemy.com/course/docker-mastery",
    price: "$84.99",
    rating: 4.7,
    ratingCount: 135000,
    category: "DevOps",
    skills: ["Docker", "Kubernetes", "CI/CD", "DevOps"],
    description: "Build, test, deploy containers with the best mega-course on Docker, Kubernetes, and Swarm.",
    imageUrl: "",
    duration: "20 hours",
    level: "Beginner",
  },
  {
    title: "AWS Certified Solutions Architect Professional",
    provider: "LinkedIn Learning",
    url: "https://www.linkedin.com/learning/aws-certified-solutions-architect-professional",
    price: "Subscription",
    rating: 4.5,
    ratingCount: 6500,
    category: "DevOps",
    skills: ["AWS", "Cloud Architecture", "DevOps", "Infrastructure"],
    description: "Earn your AWS Certified Solutions Architect Professional certification with this comprehensive course.",
    imageUrl: "",
    duration: "12 hours",
    level: "Advanced",
  },
  {
    title: "Google Cloud Digital Leader Training",
    provider: "Coursera",
    url: "https://www.coursera.org/learn/google-cloud-digital-leader",
    price: "Subscription",
    rating: 4.6,
    ratingCount: 18000,
    category: "DevOps",
    skills: ["Google Cloud", "Cloud Computing", "DevOps"],
    description: "Learn about Google Cloud products and services and how they help organizations achieve digital transformation.",
    imageUrl: "",
    duration: "8 hours",
    level: "Beginner",
  },
  {
    title: "Machine Learning A-Z: AI, Python & R",
    provider: "Udemy",
    url: "https://www.udemy.com/course/machinelearning",
    price: "$84.99",
    rating: 4.6,
    ratingCount: 220000,
    category: "Data Science",
    skills: ["Python", "Machine Learning", "Deep Learning", "Scikit-learn", "TensorFlow"],
    description: "Learn to create Machine Learning Algorithms in Python and R from two Data Science experts.",
    imageUrl: "",
    duration: "44 hours",
    level: "Beginner",
  },
  {
    title: "Google Data Analytics Professional Certificate",
    provider: "Coursera",
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    price: "Subscription",
    rating: 4.8,
    ratingCount: 95000,
    category: "Data Science",
    skills: ["SQL", "Python", "R", "Tableau", "Data Analysis"],
    description: "Prepare for a career in data analytics. No experience needed. Learn in-demand skills at your own pace.",
    imageUrl: "",
    duration: "6 months",
    level: "Beginner",
  },
  {
    title: "Deep Learning Specialization",
    provider: "Coursera",
    url: "https://www.coursera.org/specializations/deep-learning",
    price: "Subscription",
    rating: 4.9,
    ratingCount: 85000,
    category: "AI/ML",
    skills: ["Deep Learning", "TensorFlow", "Neural Networks", "Python", "AI"],
    description: "Master Deep Learning and become part of the AI revolution. Build neural networks with TensorFlow.",
    imageUrl: "",
    duration: "4 months",
    level: "Intermediate",
  },
  {
    title: "AI For Everyone",
    provider: "Coursera",
    url: "https://www.coursera.org/learn/ai-for-everyone",
    price: "Subscription",
    rating: 4.8,
    ratingCount: 72000,
    category: "AI/ML",
    skills: ["AI", "Machine Learning", "Deep Learning", "LLM"],
    description: "Understand what AI can and cannot do, and how to identify opportunities to apply AI in your own organization.",
    imageUrl: "",
    duration: "10 hours",
    level: "Beginner",
  },
  {
    title: "LangChain & Vector Databases in Production",
    provider: "Udemy",
    url: "https://www.udemy.com/course/langchain-vector-databases-in-production",
    price: "$74.99",
    rating: 4.5,
    ratingCount: 12500,
    category: "AI/ML",
    skills: ["LangChain", "Vector Databases", "RAG", "LLM", "Python"],
    description: "Build production-ready RAG applications with LangChain, ChromaDB, Pinecone, and OpenAI.",
    imageUrl: "",
    duration: "16 hours",
    level: "Intermediate",
  },
  {
    title: "Communication Foundations",
    provider: "LinkedIn Learning",
    url: "https://www.linkedin.com/learning/communication-foundations",
    price: "Subscription",
    rating: 4.6,
    ratingCount: 28000,
    category: "Soft Skills",
    skills: ["Communication", "Leadership", "Presentation", "Collaboration"],
    description: "Improve your communication skills at work. Learn to listen, speak, write, and present effectively.",
    imageUrl: "",
    duration: "2 hours",
    level: "Beginner",
  },
];

function compareCourses(skillGaps, courses) {
  const gapSkills = skillGaps.map(s => s.toLowerCase().trim());
  const scored = courses.map(c => {
    const courseSkills = c.skills.map(s => s.toLowerCase().trim());
    let matchCount = 0;
    for (const gs of gapSkills) {
      if (courseSkills.some(cs => cs.includes(gs) || gs.includes(cs))) {
        matchCount++;
      }
    }
    const coverage = gapSkills.length > 0 ? matchCount / gapSkills.length : 0;
    return { ...c, matchScore: parseFloat((coverage * 100).toFixed(1)) };
  });
  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

router.get("/", async (req, res, next) => {
  try {
    const {
      q,
      provider,
      category,
      minRating,
      maxPrice,
      level,
      page = "1",
      limit = "20",
    } = req.query;

    const where = {};
    if (q) where.title = { contains: q, mode: "insensitive" };
    if (provider) where.provider = provider;
    if (category) where.category = category;
    if (level) where.level = level;
    if (minRating) where.rating = { gte: parseFloat(minRating) };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let orderBy = { createdAt: "desc" };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({ where, orderBy, skip, take: limitNum }),
      prisma.course.count({ where }),
    ]);

    let filtered = courses;
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = courses.filter(c => {
          if (c.price === "Free") return true;
          if (c.price === "Subscription") return max >= 50;
          const match = c.price.match(/[\d.]+/);
          if (match) return parseFloat(match[0]) <= max;
          return false;
        });
      }
    }

    res.json({
      data: filtered,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
    });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
});

router.post("/recommend", async (req, res, next) => {
  try {
    const { skillGaps } = req.body;
    if (!skillGaps || !Array.isArray(skillGaps) || skillGaps.length === 0) {
      return res.status(422).json({ error: "skillGaps array is required" });
    }

    const allCourses = await prisma.course.findMany();
    const recommendations = compareCourses(skillGaps, allCourses);

    res.json({
      skillGaps,
      recommendations,
      total: recommendations.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const { title, provider, url, price, rating, ratingCount, category, skills, description, imageUrl, duration, level } = req.body;
    if (!title || !provider || !url) {
      return res.status(422).json({ error: "title, provider, and url are required" });
    }
    const course = await prisma.course.create({
      data: { title, provider, url, price, rating, ratingCount, category, skills, description, imageUrl, duration, level },
    });
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const { title, provider, url, price, rating, ratingCount, category, skills, description, imageUrl, duration, level } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, provider, url, price, rating, ratingCount, category, skills, description, imageUrl, duration, level },
    });
    res.json(course);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Course not found" });
    }
    next(err);
  }
});

router.delete("/:id", requireUser, requireAdmin, async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: "Course deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Course not found" });
    }
    next(err);
  }
});

router.post("/seed", requireUser, requireAdmin, async (_req, res, next) => {
  try {
    const created = [];
    for (const course of SEED_COURSES) {
      const existing = await prisma.course.findFirst({
        where: { title: course.title, provider: course.provider },
      });
      if (!existing) {
        const c = await prisma.course.create({ data: course });
        created.push(c.title);
      }
    }
    res.status(201).json({
      message: `Seeded ${created.length} courses`,
      courses: created,
      total: await prisma.course.count(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

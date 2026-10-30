
import express from "express";
import jwt from "jsonwebtoken";
import Job from "../models/Job.js";

const router = express.Router();

// Verify login token
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in first"
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

// Only recruiters can post and manage jobs
const recruiterOnly = (req, res, next) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({
      message: "Only recruiters can manage jobs"
    });
  }

  next();
};

// View all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch jobs"
    });
  }
});

// Post a job
router.post("/", protect, recruiterOnly, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      description,
      salary,
      skills,
      qualifications,
      applicationDeadline
    } = req.body;

    if (
      !title?.trim() ||
      !company?.trim() ||
      !location?.trim() ||
      !jobType ||
      !description?.trim() ||
      !qualifications?.trim() ||
      !applicationDeadline
    ) {
      return res.status(400).json({
        message: "Please fill in all required job details"
      });
    }

    // Validate the application deadline
    if (!/^\d{4}-\d{2}-\d{2}$/.test(applicationDeadline)) {
      return res.status(400).json({
        message: "Please provide a valid application deadline"
      });
    }

    const deadline = new Date(`${applicationDeadline}T23:59:59.999Z`);

    if (
      Number.isNaN(deadline.getTime()) ||
      deadline < new Date()
    ) {
      return res.status(400).json({
        message: "Application deadline cannot be in the past"
      });
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      jobType,
      description: description.trim(),
      salary: salary || "",
      skills: Array.isArray(skills) ? skills : [],
      qualifications: qualifications.trim(),
      applicationDeadline: new Date(`${applicationDeadline}T00:00:00.000Z`),
      recruiter: req.user.id
    });

    res.status(201).json({
      message: "Job posted successfully",
      job
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: "Failed to post job"
    });
  }
});

// View recruiter's own jobs
router.get("/my-jobs", protect, recruiterOnly, async (req, res) => {
  try {
    const jobs = await Job.find({
      recruiter: req.user.id
    }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your jobs"
    });
  }
});

// Delete recruiter's own job
router.delete("/:id", protect, recruiterOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiter: req.user.id
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found or you cannot delete this job"
      });
    }

    res.json({
      message: "Job deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid job ID or delete failed"
    });
  }
});

export default router;

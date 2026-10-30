
import express from "express";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin dashboard statistics
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers,
      totalJobSeekers,
      totalRecruiters,
      totalJobs,
      totalApplications,
    ] = await Promise.all([
      User.countDocuments({
  role: { $in: ["jobseeker", "recruiter"] },
}),
      User.countDocuments({ role: "jobseeker" }),
      User.countDocuments({ role: "recruiter" }),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalJobSeekers,
      totalRecruiters,
      totalJobs,
      totalApplications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load admin dashboard statistics",
    });
  }
});

// View registered users (admin only)
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["jobseeker", "recruiter"] },
    })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* View all jobs (admin only) */
router.get("/jobs", protect, adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch jobs",
    });
  }
});

/* Delete any job (admin only) */
router.delete("/jobs/:jobId", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // Remove applications associated with this job too.
    await Application.deleteMany({ job: job._id });

    res.json({
      message: "Job and its applications deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid job ID",
      });
    }

    res.status(500).json({
      message: "Failed to delete job",
    });
  }
});

export default router;

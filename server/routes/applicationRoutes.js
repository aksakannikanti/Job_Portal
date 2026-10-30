import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const router = express.Router();

// Create folder for uploaded resumes
const resumeDirectory = path.resolve("uploads/resumes");
fs.mkdirSync(resumeDirectory, { recursive: true });

// Configure resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ".pdf";

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype !== "application/pdf" ||
      path.extname(file.originalname).toLowerCase() !== ".pdf"
    ) {
      return cb(new Error("Only PDF resumes are allowed"));
    }

    cb(null, true);
  }
});

// Verify login token
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in first"
    });
  }

  try {
    req.user = jwt.verify(
      authHeader.split(" ")[1],
      process.env.JWT_SECRET
    );

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

// Only job seekers can apply
const jobSeekerOnly = (req, res, next) => {
  if (req.user.role !== "jobseeker") {
    return res.status(403).json({
      message: "Only job seekers can apply"
    });
  }

  next();
};

// Apply for a job
router.post(
  "/:jobId",
  protect,
  jobSeekerOnly,
  (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "Resume must be 5 MB or smaller"
          });
        }

        return res.status(400).json({
          message: "Resume upload failed"
        });
      }

      if (error) {
        return res.status(400).json({
          message: error.message || "Invalid resume file"
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const {
        fullName,
        email,
        phone,
        qualification
      } = req.body;

      if (!mongoose.isValidObjectId(jobId)) {
        return res.status(400).json({
          message: "Invalid job ID"
        });
      }

      if (
        !fullName?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !qualification?.trim()
      ) {
        return res.status(400).json({
          message: "Please fill in all required fields"
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
          message: "Please enter a valid email address"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload your resume in PDF format"
        });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        fs.unlinkSync(req.file.path);

        return res.status(404).json({
          message: "Job not found"
        });
      }

      if (
        !job.applicationDeadline ||
        new Date(job.applicationDeadline) < new Date()
      ) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "The application deadline has passed"
        });
      }

      const application = await Application.create({
        job: jobId,
        applicant: req.user.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        qualification: qualification.trim(),
        resumeLink: `/uploads/resumes/${req.file.filename}`
      });

      res.status(201).json({
        message: "Application submitted successfully",
        application
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (error.code === 11000) {
        return res.status(409).json({
          message: "You have already applied for this job"
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Please provide all required application details"
        });
      }

      console.error("Application submission error:", error);

      res.status(500).json({
        message: "Failed to submit application"
      });
    }
  }
);

// Job seeker views their applications
router.get(
  "/my-applications",
  protect,
  jobSeekerOnly,
  async (req, res) => {
    try {
      const applications = await Application.find({
        applicant: req.user.id
      })
        .populate("job")
        .sort({ createdAt: -1 });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch applications"
      });
    }
  }
);

// Recruiter views applicants for their own jobs
router.get(
  "/job/:jobId",
  protect,
  async (req, res) => {
    try {
      if (req.user.role !== "recruiter") {
        return res.status(403).json({
          message: "Only recruiters can view applicants"
        });
      }

      if (!mongoose.isValidObjectId(req.params.jobId)) {
        return res.status(400).json({
          message: "Invalid job ID"
        });
      }

      const job = await Job.findOne({
        _id: req.params.jobId,
        recruiter: req.user.id
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found or access denied"
        });
      }

      const applications = await Application.find({
        job: job._id
      })
        .populate("applicant", "name email")
        .sort({ createdAt: -1 });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch applicants"
      });
    }
  }
);

// Recruiter updates an application status
router.patch(
  "/:applicationId/status",
  protect,
  async (req, res) => {
    try {
      if (req.user.role !== "recruiter") {
        return res.status(403).json({
          message: "Only recruiters can update application status"
        });
      }

      const { status } = req.body;

      const allowedStatuses = [
        "Under Review",
        "Shortlisted",
        "Rejected"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status"
        });
      }

      if (!mongoose.isValidObjectId(req.params.applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID"
        });
      }

      const application = await Application.findById(
        req.params.applicationId
      ).populate("job");

      if (!application || !application.job) {
        return res.status(404).json({
          message: "Application not found"
        });
      }

      if (
        application.job.recruiter.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: "You cannot update this application"
        });
      }

      application.status = status;
      await application.save();

      res.json({
        message: "Application status updated",
        application
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update application status"
      });
    }
  }
);

/* View a resume securely */
router.get("/:applicationId/resume", protect, async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        message: "Invalid application ID"
      });
    }

    const application = await Application.findById(applicationId)
      .populate("job", "recruiter");

    if (!application || !application.job) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    const isApplicant =
      application.applicant.toString() === req.user.id;

    const isJobRecruiter =
      req.user.role === "recruiter" &&
      application.job.recruiter.toString() === req.user.id;

    if (!isApplicant && !isJobRecruiter) {
      return res.status(403).json({
        message: "You are not allowed to access this resume"
      });
    }

    const filename = path.basename(application.resumeLink);
    const resumePath = path.join(resumeDirectory, filename);

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({
        message: "Resume file not found"
      });
    }

    res.sendFile(resumePath, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({
          message: "Failed to open resume"
        });
      }
    });
  } catch (error) {
    console.error("Resume access error:", error);

    res.status(500).json({
      message: "Failed to access resume"
    });
  }
});


export default router;

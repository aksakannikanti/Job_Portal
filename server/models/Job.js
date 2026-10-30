
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship"],
      required: true
    },
    salary: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      required: true
    },
    skills: {
      type: [String],
      default: []
    },
    qualifications: {
      type: String,
      required: true
    },
    applicationDeadline: {
      type: Date,
      required: true
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;

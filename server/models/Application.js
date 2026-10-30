import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    qualification: {
      type: String,
      required: true,
      trim: true
    },

    resumeLink: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Applied", "Under Review", "Shortlisted", "Rejected"],
      default: "Applied"
    }
  },
  { timestamps: true }
);

// Prevent duplicate applications for the same job.
applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [resume, setResume] = useState(null);

  let user = null;

  try {
    const savedUser = localStorage.getItem("user");
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    user = null;
  }

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token && user);
  const isJobSeeker = isLoggedIn && user?.role === "jobseeker";
  const canSeeApplyButton = !isLoggedIn || isJobSeeker;

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = job?.applicationDeadline
    ? new Date(job.applicationDeadline).getTime() <
      new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    : false;

  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/jobs"
        );

        const selectedJob = response.data.find(
          (item) => item._id === jobId
        );

        if (!selectedJob) {
          if (!cancelled) setMessage("Job not found.");
          return;
        }

        if (!cancelled) {
          setJob(selectedJob);
          setMessage("");
        }
      } catch {
        if (!cancelled) {
          setMessage("Unable to load job details. Please try again.");
        }
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }

      const currentToken = localStorage.getItem("token");
      let currentUser = null;

      try {
        const savedUser = localStorage.getItem("user");
        currentUser = savedUser ? JSON.parse(savedUser) : null;
      } catch {
        currentUser = null;
      }

      if (
        !currentToken ||
        !currentUser ||
        currentUser.role !== "jobseeker"
      ) {
        return;
      }

      try {
        const applicationsResponse = await axios.get(
          "http://localhost:5000/api/applications/my-applications",
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          }
        );

        const alreadyApplied = applicationsResponse.data.some(
          (application) => {
            const appliedJobId =
              typeof application.job === "object"
                ? application.job?._id
                : application.job;

            return appliedJobId === jobId;
          }
        );

        if (!cancelled) setApplied(alreadyApplied);
      } catch {
        if (!cancelled) {
          setMessage(
            "Job details loaded, but application status could not be checked."
          );
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handleApply = () => {
    const currentToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!currentToken || !savedUser) {
      navigate("/login");
      return;
    }

    let currentUser;

    try {
      currentUser = JSON.parse(savedUser);
    } catch {
      navigate("/login");
      return;
    }

    if (currentUser.role !== "jobseeker") {
      setMessage("Only job seekers can apply for jobs.");
      return;
    }

    if (isExpired) {
      setMessage("The application deadline has passed.");
      return;
    }

    if (applied) {
      setMessage("You have already applied for this job.");
      return;
    }

    setFullName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setShowApplicationForm(true);
    setMessage("");
  };

  const handleSubmitApplication = async (event) => {
    event.preventDefault();

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      navigate("/login");
      return;
    }

    if (!resume) {
      setMessage("Please upload your resume in PDF format.");
      return;
    }

    if (
      resume.type !== "application/pdf" ||
      !resume.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Only PDF resumes are allowed.");
      return;
    }

    if (resume.size > 5 * 1024 * 1024) {
      setMessage("Resume must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("qualification", qualification.trim());
    formData.append("resume", resume);

    setApplying(true);
    setMessage("");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/applications/${jobId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      setApplied(true);
      setShowApplicationForm(false);
      setResume(null);
      setMessage(
        response.data.message || "Application submitted successfully!"
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Unable to apply. Please try again.";

      if (error.response?.status === 409) {
        setApplied(true);
        setShowApplicationForm(false);
      }

      setMessage(errorMessage);
    } finally {
      setApplying(false);
    }
  };

  const closeApplicationForm = () => {
    setShowApplicationForm(false);
    setMessage("");
    setResume(null);
  };

  if (loading) {
    return (
      <div className="job-details-page">
        <p className="jobs-message">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-details-page">
        <button
          type="button"
          className="back-to-jobs"
          onClick={() => navigate("/jobs")}
        >
          ← Back to Jobs
        </button>

        <p className="jobs-message">{message || "Job not found."}</p>
      </div>
    );
  }

  return (
    <div className="job-details-page redesigned-job-details">
      <button
        type="button"
        className="back-to-jobs"
        onClick={() => {
          if (showApplicationForm) {
            closeApplicationForm();
          } else {
            navigate("/jobs");
          }
        }}
      >
        {showApplicationForm ? "← Back to Job Details" : "← Back to Jobs"}
      </button>

      {!showApplicationForm && (
        <div className="job-details-card redesigned-details-card">
          <div className="details-header">
            <div className="details-heading-text">
              <span className="details-eyebrow">JOB OPPORTUNITY</span>
              <h1>{job.title}</h1>
              <p className="details-company">{job.company}</p>
            </div>

            <span
              className={`job-status ${
                isExpired ? "job-status-closed" : "job-status-open"
              }`}
            >
              {isExpired ? "Applications Closed" : "Open for Applications"}
            </span>
          </div>

          <div className="details-meta">
            <div className="details-meta-item">
              <span className="details-meta-label">Location</span>
              <strong>{job.location}</strong>
            </div>

            <div className="details-meta-item">
              <span className="details-meta-label">Job Type</span>
              <strong>{job.jobType}</strong>
            </div>

            <div className="details-meta-item">
              <span className="details-meta-label">Posted On</span>
              <strong>{formatDate(job.createdAt)}</strong>
            </div>

            <div className="details-meta-item">
              <span className="details-meta-label">Apply Before</span>
              <strong>{formatDate(job.applicationDeadline)}</strong>
            </div>
          </div>

          {job.salary && (
            <div className="details-content-section">
              <h2>Salary / Stipend</h2>
              <p>{job.salary}</p>
            </div>
          )}

          <div className="details-content-section">
            <h2>About the Role</h2>
            <p>{job.description}</p>
          </div>

          {job.skills?.length > 0 && (
            <div className="details-content-section">
              <h2>Required Skills</h2>
              <p className="section-subtitle">
                Skills relevant to this position
              </p>

              <div className="job-skills redesigned-skills">
                {job.skills.map((skill, index) => (
                  <span key={index}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {job.qualifications && (
            <div className="details-content-section">
              <h2>Qualifications</h2>
              <p>{job.qualifications}</p>
            </div>
          )}

          {canSeeApplyButton && (
            <div className="apply-section">
              <div>
                <h3>Interested in this position?</h3>
                <p>Submit your application to get started.</p>
              </div>

              <button
                type="button"
                className="job-apply-button redesigned-apply-button"
                onClick={handleApply}
                disabled={applied || applying || isExpired}
              >
                {isExpired
                  ? "Applications Closed"
                  : applied
                    ? "Already Applied"
                    : applying
                      ? "Submitting..."
                      : "Apply Now →"}
              </button>
            </div>
          )}

          {message && (
            <p className="application-message" role="status">
              {message}
            </p>
          )}
        </div>
      )}

      {showApplicationForm && (
        <div className="job-application-card">
          <h2>Apply for {job.title}</h2>

          <p className="job-application-subtitle">
            Complete the form below to submit your application to{" "}
            {job.company}.
          </p>

          <form
            className="job-application-form"
            onSubmit={handleSubmitApplication}
          >
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />

            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />

            <label htmlFor="qualification">Highest Qualification</label>
            <input
              id="qualification"
              type="text"
              value={qualification}
              onChange={(event) => setQualification(event.target.value)}
              placeholder="e.g. B.Tech in Computer Science"
              required
            />

            <label htmlFor="resume">Resume (PDF)</label>
            <input
              id="resume"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) =>
                setResume(event.target.files?.[0] || null)
              }
              required
            />

            {message && (
              <p className="application-message" role="status">
                {message}
              </p>
            )}

            <div className="application-form-actions">
              <button
                type="button"
                className="cancel-application-button"
                onClick={closeApplicationForm}
                disabled={applying}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="job-apply-button"
                disabled={applying}
              >
                {applying ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default JobDetails;

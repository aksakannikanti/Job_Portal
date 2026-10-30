import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function RecruiterDashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    jobType: "Full-time",
    salary: "",
    description: "",
    skills: "",
    qualifications: "",
    applicationDeadline: "",
  });

  const token = localStorage.getItem("token");

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isJobExpired = (deadline) => {
    if (!deadline) return false;

    const endOfDeadline = new Date(deadline);
    endOfDeadline.setHours(23, 59, 59, 999);

    return endOfDeadline.getTime() < Date.now();
  };

  const fetchMyJobs = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/jobs/my-jobs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setJobs(response.data);
    } catch (error) {
      setMessage(
        "Unable to load your jobs. Please log in as a recruiter."
      );
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      company: "",
      location: "",
      jobType: "Full-time",
      salary: "",
      description: "",
      skills: "",
      qualifications: "",
      applicationDeadline: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !form.applicationDeadline ||
      form.applicationDeadline < todayString
    ) {
      setMessage(
        "Please select today or a future application deadline."
      );
      return;
    }

    try {
      const jobData = {
        ...form,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== ""),
      };

      await axios.post(
        "http://localhost:5000/api/jobs",
        jobData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      resetForm();
      setShowJobForm(false);
      setMessage("Job posted successfully!");

      await fetchMyJobs();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to post the job. Please check your login."
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;

    setDeleting(true);
    setMessage("");

    try {
      await axios.delete(
        `http://localhost:5000/api/jobs/${selectedJob._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setJobs((previousJobs) =>
        previousJobs.filter(
          (job) => job._id !== selectedJob._id
        )
      );

      setMessage("Job deleted successfully!");
      setSelectedJob(null);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to delete the job."
      );
    } finally {
      setDeleting(false);
    }
  };

  const closeJobForm = () => {
    setShowJobForm(false);
    setMessage("");
    resetForm();
  };

  return (
    <div className="recruiter-page">
      {!showJobForm && (
        <>
          <div className="recruiter-heading">
            <div>
              <h1>Recruiter Dashboard</h1>
              <p>Manage your job postings and review applications.</p>
            </div>

            <button
              type="button"
              className="post-job-button"
              onClick={() => {
                setMessage("");
                setShowJobForm(true);
              }}
            >
              + Post a Job
            </button>
          </div>

          {message && (
            <p className="recruiter-message">{message}</p>
          )}

          <div className="my-jobs-section">
            <h2>My Posted Jobs</h2>

            {jobs.length === 0 ? (
              <p>You haven't posted any jobs yet.</p>
            ) : (
              <div className="jobs-grid">
                {jobs.map((job) => {
                  const isExpired = isJobExpired(
                    job.applicationDeadline
                  );

                  return (
                    <div
                      className="job-card recruiter-job-card"
                      key={job._id}
                    >
                      <div className="recruiter-job-top">
                        <span
                          className={`job-status ${
                            isExpired
                              ? "job-status-closed"
                              : "job-status-open"
                          }`}
                        >
                          {isExpired
                            ? "Applications Closed"
                            : "Accepting Applications"}
                        </span>
                      </div>

                      <h3>{job.title}</h3>
                      <p className="job-company">{job.company}</p>

                      <div className="job-details">
                        <span>{job.location}</span>
                        <span>{job.jobType}</span>
                      </div>

                      <div className="recruiter-job-dates">
                        <p>
                          <strong>Posted on:</strong>{" "}
                          {formatDate(job.createdAt)}
                        </p>

                        <p>
                          <strong>Apply by:</strong>{" "}
                          {formatDate(job.applicationDeadline)}
                        </p>
                      </div>

                      <div className="recruiter-job-actions">
                        <button
                          type="button"
                          className="view-details-button"
                          onClick={() =>
                            navigate(`/jobs/${job._id}`)
                          }
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          className="view-details-button"
                          onClick={() =>
                            navigate(
                              `/recruiter-dashboard/jobs/${job._id}/applicants`
                            )
                          }
                        >
                          View Applicants
                        </button>

                        <button
                          type="button"
                          className="delete-job-button"
                          onClick={() => setSelectedJob(job)}
                        >
                          Delete Job
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showJobForm && (
        <div className="recruiter-form-card">
          <h2>Post a New Job</h2>

          <p className="form-subtitle">
            Fill in the details to publish a job opening.
          </p>

          <form onSubmit={handleSubmit} className="job-form">
            <label htmlFor="title">Job Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Java Developer"
              value={form.title}
              onChange={handleChange}
              required
            />

            <label htmlFor="company">Company Name</label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Enter company name"
              value={form.company}
              onChange={handleChange}
              required
            />

            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Hyderabad or Remote"
              value={form.location}
              onChange={handleChange}
              required
            />

            <label htmlFor="jobType">Job Type</label>
            <select
              id="jobType"
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              required
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
            </select>

            <label htmlFor="salary">Salary / Stipend</label>
            <input
              id="salary"
              name="salary"
              type="text"
              placeholder="e.g. ₹4–6 LPA or ₹15,000/month"
              value={form.salary}
              onChange={handleChange}
            />

            <label htmlFor="applicationDeadline">
              Application Deadline
            </label>
            <input
              id="applicationDeadline"
              name="applicationDeadline"
              type="date"
              min={todayString}
              value={form.applicationDeadline}
              onChange={handleChange}
              required
            />

            <label htmlFor="description">Job Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the job responsibilities..."
              value={form.description}
              onChange={handleChange}
              rows="4"
              required
            />

            <label htmlFor="skills">Required Skills</label>
            <input
              id="skills"
              name="skills"
              type="text"
              placeholder="Java, SQL, React (separate with commas)"
              value={form.skills}
              onChange={handleChange}
            />

            <label htmlFor="qualifications">
              Qualifications
            </label>
            <textarea
              id="qualifications"
              name="qualifications"
              placeholder="e.g. B.Tech in CSE, 2027 graduates"
              value={form.qualifications}
              onChange={handleChange}
              rows="3"
              required
            />

            {message && (
              <p className="recruiter-message">{message}</p>
            )}

            <div className="job-form-actions">
              <button type="submit">Post Job</button>

              <button
                type="button"
                onClick={closeJobForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedJob && (
        <div
          className="delete-modal-overlay"
          onClick={() => {
            if (!deleting) setSelectedJob(null);
          }}
        >
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <span>!</span>
            </div>

            <h2 id="delete-modal-title">Delete this job?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedJob.title}</strong> at{" "}
              <strong>{selectedJob.company}</strong>? This action
              cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-delete-button"
                onClick={() => setSelectedJob(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;

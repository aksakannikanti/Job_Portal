import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please log in to view your applications.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "https://job-portal-backend-b2hp.onrender.com/api/applications/my-applications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setApplications(response.data);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Unable to load your applications."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Shortlisted":
        return "shortlisted";
      case "Rejected":
        return "rejected";
      case "Under Review":
        return "under-review";
      default:
        return "applied";
    }
  };

  if (loading) {
    return (
      <div className="applications-page">
        <p className="jobs-message">
          Loading your applications...
        </p>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="applications-heading">
        <div>
          <h1>My Applications</h1>
          <p>Keep track of the jobs you've applied for.</p>
        </div>
      </div>

      {message ? (
        <div className="applications-empty">
          <h2>Unable to show applications</h2>
          <p>{message}</p>

          {!localStorage.getItem("token") && (
            <Link
              to="/login"
              className="applications-browse-button"
            >
              Login
            </Link>
          )}
        </div>
      ) : applications.length === 0 ? (
        <div className="applications-empty">
          <h2>No applications yet</h2>
          <p>Jobs you apply for will appear here.</p>

          <Link
            to="/jobs"
            className="applications-browse-button"
          >
            Explore Jobs
          </Link>
        </div>
      ) : (
        <>
          <p className="applications-count">
            {applications.length}{" "}
            {applications.length === 1
              ? "application"
              : "applications"}
          </p>

          <div className="applications-list">
            {applications.map((application) => {
              const job = application.job;

              return (
                <article
                  className={`application-card ${
                    job ? "clickable-application-card" : ""
                  }`}
                  key={application._id}
                  onClick={() => {
                    if (job?._id) {
                      navigate(`/jobs/${job._id}`);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      job?._id &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      navigate(`/jobs/${job._id}`);
                    }
                  }}
                  role={job ? "link" : undefined}
                  tabIndex={job ? 0 : undefined}
                  aria-label={
                    job
                      ? `View details for ${job.title}`
                      : undefined
                  }
                >
                  <div className="application-card-top">
                    <div>
                      <h2>{job?.title || "Job no longer available"}</h2>
                      <p className="application-company">
                        {job?.company || "Company unavailable"}
                      </p>
                    </div>

                    <span
                      className={`application-status ${getStatusClass(
                        application.status
                      )}`}
                    >
                      {application.status || "Applied"}
                    </span>
                  </div>

                  {job && (
                    <div className="application-job-info">
                      {job.location && (
                        <span>📍 {job.location}</span>
                      )}
                      {job.jobType && <span>{job.jobType}</span>}
                    </div>
                  )}

                  <div className="application-dates">
                    <p>
                      <span>Applied on</span>
                      <strong>
                        {formatDate(application.createdAt)}
                      </strong>
                    </p>

                    {job?.applicationDeadline && (
                      <p>
                        <span>Application deadline</span>
                        <strong>
                          {formatDate(job.applicationDeadline)}
                        </strong>
                      </p>
                    )}
                  </div>

                  {job && (
                    <p className="application-view-hint">
                      View job details →
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default MyApplications;
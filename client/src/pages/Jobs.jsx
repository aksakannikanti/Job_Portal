import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/jobs"
        );

        setJobs(response.data);
      } catch (error) {
        setMessage("Unable to load jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const formatDeadline = (deadline) => {
    if (!deadline) {
      return "Not specified";
    }

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) {
      return "Not specified";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="jobs-page">
      <div className="jobs-heading">
        <h1>Find Your Next Job</h1>
        <p>
          Explore job openings and internships that match your interests.
        </p>
      </div>

      {loading && (
        <p className="jobs-message">Loading jobs...</p>
      )}

      {!loading && message && (
        <p className="jobs-message">{message}</p>
      )}

      {!loading && !message && jobs.length === 0 && (
        <div className="empty-jobs">
          <h3>No jobs available yet</h3>
          <p>Please check back later for new job openings.</p>
        </div>
      )}

      {!loading && !message && jobs.length > 0 && (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div className="job-card" key={job._id}>
              <div className="job-card-content">
                <div className="job-card-info">
                  <h3>{job.title}</h3>

                  <p className="job-company">
                    {job.company}
                  </p>

                  <div className="job-details">
                    <span>📍 {job.location}</span>
                    <span>{job.jobType}</span>
                  </div>
                </div>

                <div className="job-deadline">
                  <span className="deadline-label">
                    <span>📅</span> Apply before
                  </span>

                  <p className="deadline-date">
                    {formatDeadline(job.applicationDeadline)}
                  </p>
                </div>
              </div>

              <div className="job-card-footer">
                <button
                  type="button"
                  className="view-details-button"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  View Details <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Jobs;

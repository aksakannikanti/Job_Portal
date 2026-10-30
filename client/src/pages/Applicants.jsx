
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please log in to view applicants.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/applications/job/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const fetchedApplications = response.data;

        setApplications(fetchedApplications);

        setStatuses(
          Object.fromEntries(
            fetchedApplications.map((application) => [
              application._id,
              application.status
            ])
          )
        );

        if (fetchedApplications.length > 0) {
          const firstApplication = fetchedApplications[0];
          setJob(firstApplication.job || null);
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Unable to load applicants."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleStatusChange = (applicationId, status) => {
    setStatuses((previous) => ({
      ...previous,
      [applicationId]: status
    }));
  };

  const updateStatus = async (applicationId) => {
    const token = localStorage.getItem("token");
    const status = statuses[applicationId];

    setUpdatingId(applicationId);
    setMessage("");

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/applications/${applicationId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setApplications((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: response.data.application.status
              }
            : application
        )
      );

      setMessage("Application status updated successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Open resume through the protected backend route.
  const viewResume = async (applicationId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in to view the resume.");
      return;
    }

    setMessage("");

    try {
      const response = await axios.get(
        `http://localhost:5000/api/applications/${applicationId}/resume`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: "blob"
        }
      );

      const fileURL = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf"
        })
      );

      const newWindow = window.open(fileURL, "_blank");

      if (!newWindow) {
        const link = document.createElement("a");
        link.href = fileURL;
        link.download = "resume.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      window.setTimeout(() => {
        window.URL.revokeObjectURL(fileURL);
      }, 60000);
    } catch (error) {
      setMessage(
        error.response?.status === 403
          ? "You are not allowed to access this resume."
          : error.response?.status === 401
          ? "Your session has expired. Please log in again."
          : "Unable to open the resume. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="jobs-page">
        <p className="jobs-message">Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      <button
        type="button"
        className="view-details-button"
        onClick={() => navigate("/recruiter-dashboard")}
      >
        ← Back to Dashboard
      </button>

      <h1>Job Applicants</h1>

      {job && (
        <p>
          Applicants for <strong>{job.title}</strong> at{" "}
          <strong>{job.company}</strong>
        </p>
      )}

      {message && (
        <p className="jobs-message">{message}</p>
      )}

      {!message && applications.length === 0 && (
        <p className="jobs-message">
          No applicants have applied for this job yet.
        </p>
      )}

      <div className="jobs-grid">
        {applications.map((application) => (
          <div className="job-card" key={application._id}>
            <h2>{application.fullName}</h2>

            <p>
              <strong>Email:</strong> {application.email}
            </p>

            <p>
              <strong>Phone:</strong> {application.phone}
            </p>

            <p>
              <strong>Highest Qualification:</strong>{" "}
              {application.qualification}
            </p>

            <p>
              <strong>Applied on:</strong>{" "}
              {formatDate(application.createdAt)}
            </p>

            <p>
              <strong>Current Status:</strong>{" "}
              {application.status}
            </p>

            {application.resumeLink && (
              <p>
                <button
                  type="button"
                  className="view-details-button"
                  onClick={() => viewResume(application._id)}
                >
                  View Resume (PDF)
                </button>
              </p>
            )}

            <label htmlFor={`status-${application._id}`}>
              Update Application Status
            </label>

            <select
              id={`status-${application._id}`}
              value={
                statuses[application._id] ||
                application.status
              }
              onChange={(e) =>
                handleStatusChange(
                  application._id,
                  e.target.value
                )
              }
            >
              <option value="Applied" disabled>
                Applied
              </option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button
              type="button"
              className="view-details-button"
              onClick={() => updateStatus(application._id)}
              disabled={
                updatingId === application._id ||
                statuses[application._id] === application.status
              }
            >
              {updatingId === application._id
                ? "Updating..."
                : "Update Status"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Applicants;

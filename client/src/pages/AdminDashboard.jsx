import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [jobMessage, setJobMessage] = useState("");
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    let user = null;

    try {
      const savedUser = localStorage.getItem("user");
      user = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      user = null;
    }

    const token = localStorage.getItem("token");

    if (!token || user?.role !== "admin") {
      setMessage("Admin login is required to access this dashboard.");
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [statsResponse, usersResponse, jobsResponse] =
          await Promise.all([
            axios.get("http://localhost:5000/api/admin/stats", config),
            axios.get("http://localhost:5000/api/admin/users", config),
            axios.get("http://localhost:5000/api/admin/jobs", config),
          ]);

        setStats(statsResponse.data);
        setUsers(usersResponse.data);
        setJobs(jobsResponse.data);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const deleteJob = async () => {
    if (!jobToDelete) return;

    const jobId = jobToDelete._id;
    const token = localStorage.getItem("token");

    setDeletingJobId(jobId);
    setJobMessage("");

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setJobs((previous) =>
        previous.filter((job) => job._id !== jobId)
      );

      setStats((previous) => ({
        ...previous,
        totalJobs: Math.max(0, previous.totalJobs - 1),
      }));

      setJobMessage("Job deleted successfully.");
      setJobToDelete(null);
    } catch (error) {
      setJobMessage(
        error.response?.data?.message || "Failed to delete job."
      );
    } finally {
      setDeletingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="jobs-page">
        <p className="jobs-message">Loading admin dashboard...</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="jobs-page">
        <h1>Admin Dashboard</h1>
        <p className="jobs-message">{message}</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Job Seekers", value: stats.totalJobSeekers },
    { label: "Recruiters", value: stats.totalRecruiters },
    { label: "Total Jobs", value: stats.totalJobs },
    { label: "Applications", value: stats.totalApplications },
  ];

  return (
    <div className="jobs-page">
      <h1>Admin Dashboard</h1>
      <p>Manage and monitor your Job Portal.</p>

      {/* Dashboard Statistics */}
      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div className="admin-stat-card" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </div>
        ))}
      </div>

      {/* Registered Users */}
      <section className="admin-users-section">
        <h2>Registered Users</h2>
        <p>View all job seekers, recruiters, and administrators.</p>

        {users.length === 0 ? (
          <p className="jobs-message">No registered users found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered On</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`admin-role ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Job Management */}
      <section className="admin-users-section">
        <h2>Job Management</h2>
        <p>Review jobs posted by recruiters.</p>

        {jobMessage && (
          <p className="jobs-message">{jobMessage}</p>
        )}

        {jobs.length === 0 ? (
          <p className="jobs-message">
            No jobs have been posted yet.
          </p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Recruiter</th>
                  <th>Posted On</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>{job.title}</td>
                    <td>{job.company}</td>
                    <td>{job.recruiter?.name || "Unavailable"}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="view-details-button"
                        disabled={deletingJobId === job._id}
                        onClick={() => setJobToDelete(job)}
                      >
                        Delete Job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Custom Delete Confirmation Popup */}
      {jobToDelete && (
        <div className="delete-popup">
          <div className="delete-popup-content">
            <h3>Delete this job?</h3>

            <p>
              Are you sure you want to delete{" "}
              <strong>{jobToDelete.title}</strong>?
            </p>

            <p>This will also delete all applications for this job.</p>

            <div className="delete-popup-actions">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                disabled={deletingJobId !== null}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteJob}
                disabled={deletingJobId !== null}
              >
                {deletingJobId === jobToDelete._id
                  ? "Deleting..."
                  : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

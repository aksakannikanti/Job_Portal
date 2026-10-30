import { Link } from "react-router-dom";

function Home() {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
  }

  // Admin Home
  if (user?.role === "admin") {
    return (
      <div className="home">
        <section className="hero">
          <p className="hero-tag">JOBPORTAL ADMINISTRATION</p>

          <h1>
            Welcome to
            <br />
            JobPortal Admin
          </h1>

          <p className="hero-description">
            Manage your Job Portal and monitor registered users,
            recruiters, job listings, and applications from one place.
          </p>

          <div className="hero-buttons">
            <Link to="/admin-dashboard" className="primary-btn">
              Open Admin Dashboard
            </Link>
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>User Management</h3>
            <p>View registered users and their roles.</p>
          </div>

          <div className="feature-card">
            <h3>Job Management</h3>
            <p>Monitor jobs posted by recruiters.</p>
          </div>

          <div className="feature-card">
            <h3>Platform Monitoring</h3>
            <p>Review user, job, and application statistics.</p>
          </div>
        </section>
      </div>
    );
  }

  // Recruiter Home
  if (user?.role === "recruiter") {
    return (
      <div className="home">
        <section className="hero">
          <p className="hero-tag">RECRUITER PORTAL</p>

          <h1>
            Welcome back,
            <br />
            {user.name || "Recruiter"}
          </h1>

          <p className="hero-description">
            Find the right talent for your team. Post job openings,
            connect with candidates, and manage your hiring process
            through one platform.
          </p>

          <div className="hero-buttons">
            <Link to="/recruiter-dashboard" className="primary-btn">
              Go to Recruiter Dashboard
            </Link>
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>Post Jobs</h3>
            <p>Publish job openings and reach potential candidates.</p>
          </div>

          <div className="feature-card">
            <h3>Manage Applicants</h3>
            <p>Review applications and explore candidate details.</p>
          </div>

          <div className="feature-card">
            <h3>Manage Job Postings</h3>
            <p>View and manage all your posted job openings.</p>
          </div>
        </section>
      </div>
    );
  }


  // Guest and Jobseeker Home
  return (
    <div className="home">
      <section className="hero">
        <p className="hero-tag">YOUR CAREER STARTS HERE</p>

        <h1>
          Find Your Dream Job
          <br />
          and Start Your Career
        </h1>

        <p className="hero-description">
          Explore jobs and internships, connect with recruiters,
          and take the next step in your professional journey.
        </p>

        <div className="hero-buttons">
          <Link to="/jobs" className="primary-btn">
            Browse Jobs
          </Link>

          {!user && (
            <Link to="/register" className="secondary-btn">
              Create Account
            </Link>
          )}
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Find Jobs</h3>
          <p>Explore opportunities that match your skills and interests.</p>
        </div>

        <div className="feature-card">
          <h3>Discover Internships</h3>
          <p>Gain practical experience and begin building your career.</p>
        </div>

        <div className="feature-card">
          <h3>Track Applications</h3>
          <p>Keep track of your applications and their current status.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
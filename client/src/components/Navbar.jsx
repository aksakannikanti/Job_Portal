import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const getSavedUser = () => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getSavedUser);

  useEffect(() => {
    const updateUser = () => {
      setUser(getSavedUser());
    };

    window.addEventListener("storage", updateUser);
    window.addEventListener("userLogin", updateUser);
    window.addEventListener("userLogout", updateUser);
    window.addEventListener("focus", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("userLogin", updateUser);
      window.removeEventListener("userLogout", updateUser);
      window.removeEventListener("focus", updateUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    window.dispatchEvent(new Event("userLogout"));
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        JobPortal
      </Link>

      <div className="nav-links">
        {/* Home always opens the homepage */}
        <NavLink
  to="/"
  end
  className={({ isActive }) => (isActive ? "active" : "")}
>
  Home
</NavLink>

        {/* Guest navigation */}
        {!user && (
          <>
            <Link to="/jobs">Browse Jobs</Link>
            <Link to="/login">Login</Link>
            <Link to="/register" className="nav-register">
              Register
            </Link>
          </>
        )}

        {/* Jobseeker navigation */}
        {user?.role === "jobseeker" && (
          <>
            <NavLink
  to="/jobs"
  className={({ isActive }) => (isActive ? "active" : "")}
>
  Browse Jobs
</NavLink>

<NavLink
  to="/my-applications"
  className={({ isActive }) => (isActive ? "active" : "")}
>
  My Applications
</NavLink>
            <span>Hi, {user.name}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {/* Recruiter navigation */}
        {user?.role === "recruiter" && (
          <>
            <NavLink
  to="/recruiter-dashboard"
  className={({ isActive }) => (isActive ? "active" : "")}
>
  My Dashboard
</NavLink>
            <span>Hi, {user.name}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {/* Admin navigation */}
        {user?.role === "admin" && (
          <>
            <NavLink
  to="/admin-dashboard"
  className={({ isActive }) => (isActive ? "active" : "")}
>
  Admin Dashboard
</NavLink>
            <span>Hi, {user.name}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

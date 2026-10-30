
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications";
import Applicants from "./pages/Applicants";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route
          path="/recruiter-dashboard/jobs/:jobId/applicants"
          element={<Applicants />}
        />
        <Route
          path="/jobs/:jobId"
          element={<JobDetails />}
        />
        <Route
          path="/recruiter-dashboard"
          element={<RecruiterDashboard />}
        />
        <Route
          path="/my-applications"
          element={<MyApplications />}
        />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

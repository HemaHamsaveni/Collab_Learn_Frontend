import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup"; // NEW
import DashboardLayout from "./components/DashboardLayout"; 
import DashboardHome from "./pages/DashboardHome"; 
import ProfileSummary from "./pages/ProfileSummary"; // NEW

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Standalone Setup Route */}
        <Route path="/profile-setup" element={<ProfileSetup />} />

        {/* Protected Dashboard Routes (Wrapped in Layout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Default Dashboard Home */}
          <Route index element={<DashboardHome />} /> 
          
          {/* Profile Summary Page (Changed from profileSummary to profile to match sidebar!) */}
          <Route path="profile" element={<ProfileSummary />} /> 
          
          {/* Placeholders */}
          <Route path="find-groups" element={<div className="p-8 text-xl font-bold">Find Groups Page Coming Soon!</div>} />
          <Route path="my-groups" element={<div className="p-8 text-xl font-bold">My Groups Page Coming Soon!</div>} />
          <Route path="resources" element={<div className="p-8 text-xl font-bold">Study Resources Coming Soon!</div>} />
          <Route path="schedule" element={<div className="p-8 text-xl font-bold">Schedule Coming Soon!</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
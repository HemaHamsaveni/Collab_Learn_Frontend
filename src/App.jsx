import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- PAGES ---
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import DashboardHome from "./pages/DashboardHome"; 
import ProfileSummary from "./pages/ProfileSummary";
import MyGroups from "./pages/MyGroups"; 
import FindGroups from "./pages/FindGroups"; 

// --- NEWLY ADDED PAGE FOR PHASE 4 ---
import StudyResources from "./pages/StudyResources"; // Make sure the path matches where you saved it

// --- COMPONENTS ---
import DashboardLayout from "./components/DashboardLayout"; 

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
          
          {/* Profile Summary Page */}
          <Route path="profile" element={<ProfileSummary />} /> 
          
          {/* Group Management */}
          <Route path="my-groups" element={<MyGroups />} />
          <Route path="find-groups" element={<FindGroups />} />
          
          {/* ✅ PHASE 4: AI Study Resources (Updated from placeholder) */}
          <Route path="resources" element={<StudyResources />} />
          
          {/* Placeholder for Future Phase */}
          <Route path="schedule" element={<div className="p-8 text-xl font-bold">Schedule Coming Soon!</div>} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
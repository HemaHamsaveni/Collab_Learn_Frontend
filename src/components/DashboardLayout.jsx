import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'; // ✨ ADDED useLocation
import { LayoutDashboard, Search, Users, BookOpen, Calendar, LogOut, UserCircle, ChevronDown, User, Check } from 'lucide-react'; // ✨ ADDED Check

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✨ NEW
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(''); // ✨ NEW
  const profileRef = useRef(null);
  
  // Dynamically grab the real logged-in user's details from Local Storage
  const user = { 
    username: localStorage.getItem("userName") || "Student", 
    email: localStorage.getItem("userEmail") || "student@example.com" 
  };

  // ✨ Catch success messages from Login or Register
  useEffect(() => {
    if (location.state && location.state.message) {
      setToastMessage(location.state.message);
      
      // Clear the message from history so it doesn't show again on refresh
      window.history.replaceState({}, document.title);

      // Hide toast after 3 seconds
      setTimeout(() => setToastMessage(''), 3000);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.clear(); // Clear the VIP wristband!
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Profile Summary', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
    { name: 'Find Study Groups', path: '/dashboard/find-groups', icon: <Search size={20} /> },
    { name: 'My Groups', path: '/dashboard/my-groups', icon: <Users size={20} /> },
    { name: 'Study Resources', path: '/dashboard/resources', icon: <BookOpen size={20} /> },
    { name: 'Schedule', path: '/dashboard/schedule', icon: <Calendar size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden relative">
      
      {/* ✨ TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-[#1ABC9C] text-white px-6 py-3 rounded-xl shadow-lg z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check size={20} /> <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col justify-between p-4 z-10">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2">
            <img src="/logo.png" alt="CollabLearn" className="w-10 h-10 object-contain" />
            <div>
                <h1 className="font-bold text-xl text-brandPrimary leading-none">CollabLearn</h1>
                <p className="text-xs text-gray-500">Learn smarter. Together.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'} 
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive 
                      ? 'bg-brandSecondary/10 text-brandSecondary font-bold' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-brandPrimary'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium mt-auto"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* HEADER */}
        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white shrink-0 z-20">
          <div>
            <h2 className="text-2xl font-bold text-brandPrimary">Welcome, {user.username}</h2>
            <p className="text-gray-500 text-sm">Ready to learn together?</p>
          </div>
          
          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={profileRef}>
            <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors outline-none"
            >
                <div className="w-10 h-10 rounded-full border-2 border-brandSecondary bg-gray-100 overflow-hidden flex items-center justify-center text-brandSecondary font-bold text-lg uppercase">
                    {user.username.charAt(0)}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-sm font-bold text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button 
                        onClick={() => {
                            navigate('/dashboard/profile');
                            setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brandSecondary flex items-center gap-2"
                    >
                        <User size={16} /> Profile
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
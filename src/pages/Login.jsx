import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  // States for Forgot Password flow
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetData, setResetData] = useState({
    username: "",
    newPassword: ""
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // ✨ NEW: For inline success messages
  const [isLoading, setIsLoading] = useState(false);

  // Handlers for Login Form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handlers for Reset Password Form
  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8082/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId || data.id); 
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", formData.email); 

        // ✨ THE FIX: Navigate silently and pass the success message to DashboardLayout!
        navigate("/dashboard", { state: { message: "Welcome back! Login successful. 🎉" } }); 
        
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText || "Invalid credentials");
      }
    } catch (error) {
      setErrorMessage("Cannot connect to server. Is Spring Boot running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8082/api/users/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetData),
      });

      if (response.ok) {
        // ✨ Replaced alert with a clean inline success message
        setSuccessMessage("Password reset successfully! Please log in.");
        setIsForgotPasswordMode(false); // Switch back to login view
        setResetData({ username: "", newPassword: "" }); // Clear the form
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Reset failed");
      }
    } catch (error) {
      setErrorMessage("Cannot connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-400 px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative transition-all duration-300">
        <Link to="/" className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 text-xl font-bold">✕</Link>

        <div className="flex justify-between items-start mb-8 mt-4">
          <h2 className="text-4xl font-extrabold text-black">
            {isForgotPasswordMode ? "Reset" : "Login"}
          </h2>
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <span className="text-xs font-bold mt-1">CollabLearn</span>
          </div>
        </div>

        {/* ✨ Inline Error and Success Messages */}
        {errorMessage && <p className="text-red-500 text-sm mb-4 text-center font-semibold">{errorMessage}</p>}
        {successMessage && <p className="text-green-500 text-sm mb-4 text-center font-semibold">{successMessage}</p>}

        {!isForgotPasswordMode ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email" 
              required
              className="w-full bg-[#2bd0b6] text-white placeholder-white/90 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-brandPrimary transition"
            />
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password" 
              required
              className="w-full bg-[#2bd0b6] text-white placeholder-white/90 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-brandPrimary transition"
            />
            
            <div className="text-right pb-2">
              <button 
                type="button"
                onClick={() => { setIsForgotPasswordMode(true); setErrorMessage(""); setSuccessMessage(""); }} 
                className="text-sm text-gray-500 hover:text-brandPrimary font-medium outline-none"
              >
                forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white text-xl font-semibold py-4 rounded-full shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brandPrimary hover:bg-blue-900'}`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4 font-medium">
              Don't have an account? <Link to="/register" className="text-brandSecondary font-bold hover:underline">Register here</Link>
            </p>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handlePasswordReset} className="space-y-4">
             <p className="text-sm text-gray-600 mb-4 text-center font-medium">Enter your username and a new password to regain access.</p>
             <input 
              type="text" 
              name="username"
              value={resetData.username}
              onChange={handleResetChange}
              placeholder="Your Username" 
              required
              className="w-full border-2 border-[#2bd0b6] text-black px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-brandPrimary transition"
            />
            <input 
              type="password" 
              name="newPassword"
              value={resetData.newPassword}
              onChange={handleResetChange}
              placeholder="New Password" 
              required
              className="w-full border-2 border-[#2bd0b6] text-black px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-brandPrimary transition"
            />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white text-xl font-semibold py-4 rounded-full shadow-md transition-all mt-4 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brandSecondary hover:bg-teal-600'}`}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => { setIsForgotPasswordMode(false); setErrorMessage(""); }} 
                className="text-sm text-gray-500 hover:text-brandPrimary font-medium outline-none"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
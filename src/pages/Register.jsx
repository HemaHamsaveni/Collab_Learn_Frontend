import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault(); 
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8082/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId || data.id); 
        localStorage.setItem("userName", data.name || formData.name);
        localStorage.setItem("userEmail", formData.email);

        // ✨ THE FIX: Silently glide to Profile Setup with no alert popup!
        navigate("/profile-setup"); 
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText || "Registration failed");
      }
    } catch (error) {
      setErrorMessage("Cannot connect to server. Is Spring Boot running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-400 px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative transition-all duration-300">
        <Link to="/" className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 text-xl font-bold">✕</Link>

        <div className="flex justify-between items-start mb-8 mt-4">
          <h2 className="text-4xl font-extrabold text-black">Register</h2>
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <span className="text-xs font-bold mt-1">CollabLearn</span>
          </div>
        </div>

        {errorMessage && <p className="text-red-500 text-sm mb-4 text-center font-semibold">{errorMessage}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Username" 
            required
            className="w-full bg-[#2bd0b6] text-white placeholder-white/90 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-brandPrimary transition"
          />
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

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white text-xl font-semibold py-4 rounded-full shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brandPrimary hover:bg-blue-900'}`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          Already have an account? <Link to="/login" className="text-brandSecondary font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      
      {/* 1. THE LOGO */}
      {/* Ensure your logo file is named exactly 'logo.png' and is inside the 'public' folder */}
      <img 
        src="/logo.png" 
        alt="CollabLearn Logo" 
        className="w-64 h-auto mb-6" 
      />
      
      {/* 2. MAIN TITLE */}
      <h1 className="text-6xl font-extrabold text-black tracking-tight mb-4">
        CollabLearn
      </h1>
      
      {/* 3. SUBTITLE */}
      <p className="text-2xl text-black mb-8">
        Learn smarter. Together.
      </p>
      
      {/* 4. TAGLINE */}
      <p className="text-lg italic text-gray-600 mb-12 text-center max-w-md">
        Find the right study group. Stay consistent. Learn better.
      </p>

      {/* 5. BUTTONS */}
      <div className="w-full max-w-xs space-y-4">
        <Link 
          to="/login"
          className="flex justify-center w-full py-4 text-xl bg-white text-brandPrimary font-semibold rounded-lg border-2 border-brandPrimary hover:bg-gray-50 transition-colors"
        >
          Login
        </Link>
        <Link 
          to="/register"
          className="flex justify-center w-full py-4 text-xl bg-brandPrimary text-white font-semibold rounded-lg shadow-md hover:bg-brandPrimary/90 transition-colors"
        >
          Register
        </Link>
      </div>
      
    </div>
  );
}
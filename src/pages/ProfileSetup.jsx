import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Edit, Plus, Trash2, Save } from 'lucide-react';

const ProfileSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pull real name/email if available
  const initialData = location.state || { 
    username: localStorage.getItem("userName") || 'User', 
    email: localStorage.getItem("userEmail") || 'user@example.com' 
  };

  const [profileData, setProfileData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // ✨ NEW: For inline error handling

  const [formDetails, setFormDetails] = useState({
    fullName: '', degree: '', specialization: '', semester: '', year: '', learningStyle: '', groupSize: ''
  });

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let completed = 0;
    const totalFields = 11;
    if (formDetails.fullName?.trim()) completed++;
    if (formDetails.degree) completed++;
    if (formDetails.specialization) completed++;
    if (formDetails.semester) completed++;
    if (formDetails.year) completed++;
    if (selectedSubjects.length > 0) completed++;
    if (formDetails.learningStyle) completed++;
    if (selectedDays.length > 0) completed++;
    if (timeFrom) completed++;
    if (timeTo) completed++;
    if (formDetails.groupSize?.trim()) completed++;

    setProgress(Math.round((completed / totalFields) * 100));
  }, [formDetails, selectedSubjects, selectedDays, timeFrom, timeTo]);

  const handleInputChange = (e) => setFormDetails({ ...formDetails, [e.target.name]: e.target.value });
  const toggleEdit = () => setIsEditing(!isEditing);
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  
  // --- CONNECTING TO JAVA BACKEND ---
  const handleSave = async () => {
    if (isSaving) return; 
    setIsSaving(true);    
    setErrorMessage(""); // Clear old errors

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    const payload = { ...formDetails, selectedSubjects, selectedDays, timeFrom, timeTo };
    
    try {
      const response = await fetch(`http://localhost:8082/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      }); 

      if (response.ok) {
        // ✨ THE FIX: Navigate silently and pass the success message!
        navigate('/dashboard', { state: { message: "Profile Setup Complete! 🎉" } }); 
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText || "Failed to save profile."); // Inline error
        setIsSaving(false); 
      }
    } catch (error) {
      setErrorMessage("Server offline or network error. Please try again."); // Inline error
      setIsSaving(false); 
    }
  };

  const allSubjects = [
    "Ad Hoc and Sensor Networks", "Advanced Algorithms", "Advanced Web Technology", "Agile Methodologies", "Artificial Intelligence", "Big Data Analytics", "Blockchain Technology", "Business Analytics", "C Programming", "Cloud Computing", "Compiler Design", "Computer Architecture", "Computer Graphics", "Computer Networks", "Computer Vision", "Cryptography and Network Security", "Cyber Security", "Data Analytics", "Data Science", "Data Structures", "Database Management Systems (DBMS)", "Deep Learning", "Design and Analysis of Algorithms", "Digital Logic and Design", "Discrete Mathematics", "Distributed Systems", "Engineering Chemistry", "Engineering Graphics", "Engineering Physics", "Ethics in Data Science", "Game Design", "Green Computing", "Human Computer Interaction", "Information Retrieval", "Information Security", "Internet of Things (IoT)", "Java Programming (OOPs)", "Linear Algebra", "Machine Learning", "Mobile App Development", "Multimedia Systems", "Natural Language Processing (NLP)", "Operating Systems", "Probability and Statistics", "Professional Ethics", "Python Programming", "Reinforcement Learning", "Social Network Analysis", "Software Engineering", "Software Project Management", "Software Testing", "Statistics for Data Science", "Theory of Computation", "User Interface Design (UI/UX)", "Virtual and Augmented Reality", "Web Development (Full Stack)", "Web Technology"
  ];
  
  const handleAddSubject = (e) => {
    const subjectName = e.target.value;
    if (subjectName && !selectedSubjects.find(s => s.name === subjectName)) {
      setSelectedSubjects([...selectedSubjects, { name: subjectName, level: 1 }]);
    }
    e.target.value = "";
  };

  const handleRemoveSubject = (index) => {
    const newSubjects = [...selectedSubjects];
    newSubjects.splice(index, 1);
    setSelectedSubjects(newSubjects);
  };

  const handleSliderChange = (index, value) => {
    const newSubjects = [...selectedSubjects];
    newSubjects[index].level = parseInt(value);
    setSelectedSubjects(newSubjects);
  };

  const getLevelLabel = (val) => { return val === 1 ? 'Basic' : val === 2 ? 'Intermediate' : 'Advanced'; };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const clearTimeFrom = () => setTimeFrom('');
  const clearTimeTo = () => setTimeTo('');

  const initialLetter = (formDetails.fullName || profileData.username || "U").charAt(0).toUpperCase();

  return (
    <div className="h-screen w-screen bg-white p-4 font-sans overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-1 shrink-0">
        <div>
            <h1 className="text-3xl font-extrabold text-black">Profile Setup</h1>
            <div className="flex items-center gap-3 mt-1">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brandSecondary transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-brandSecondary">{progress}% Completed</span>
            </div>
        </div>
        <img src="/logo.png" alt="Logo" className="w-20 h-auto object-contain" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 mt-2">
        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
          <div className="border-2 border-brandSecondary rounded-2xl p-4 relative flex items-center gap-4 shrink-0 mb-2">
             <button onClick={toggleEdit} className="absolute top-2 right-2 cursor-pointer hover:bg-teal-50 rounded-full p-1 transition-colors z-10">
                {isEditing ? <Save className="w-5 h-5 text-brandSecondary" /> : <Edit className="w-4 h-4 text-black" />}
             </button>

             <div className="w-20 h-20 rounded-full border-2 border-brandSecondary bg-gray-100 flex items-center justify-center text-brandSecondary font-bold text-4xl shrink-0">
                {initialLetter}
             </div>
             
             <div className="overflow-hidden w-full pr-6">
                {isEditing ? (
                  <div className="flex flex-col gap-1">
                    <input name="username" value={profileData.username || ""} onChange={handleProfileChange} className="border-b border-gray-300 outline-none text-sm font-bold w-full" placeholder="Username" />
                    <input name="email" value={profileData.email || ""} onChange={handleProfileChange} className="border-b border-gray-300 outline-none text-xs text-gray-600 w-full" placeholder="Email" />
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-black truncate">{profileData.username}</p>
                    <p className="text-sm text-gray-600 truncate">{profileData.email}</p>
                  </>
                )}
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Full Name</label>
            <input name="fullName" value={formDetails.fullName || ""} onChange={handleInputChange} type="text" placeholder="Enter your full name" className="w-full border border-brandSecondary rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brandSecondary/50 text-black" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Degree</label>
            <select name="degree" value={formDetails.degree || ""} onChange={handleInputChange} className="w-full border border-brandSecondary rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brandSecondary/50 text-black bg-white">
              <option value="">Select Degree (None)</option>
              <option value="BE">Bachelor of Engineering (B.E.)</option>
              <option value="BTech">Bachelor of Technology (B.Tech)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Specialization</label>
            <select name="specialization" value={formDetails.specialization || ""} onChange={handleInputChange} className="w-full border border-brandSecondary rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brandSecondary/50 text-black bg-white">
              <option value="">Select Specialization (None)</option>
              <option value="CSE">Computer Science and Engineering (CSE)</option>
              <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
              <option value="IT">Information Technology (IT)</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Semester</label>
              <select name="semester" value={formDetails.semester || ""} onChange={handleInputChange} className="w-full border border-brandSecondary rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brandSecondary/50 text-black bg-white">
                <option value="">None</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Year</label>
              <select name="year" value={formDetails.year || ""} onChange={handleInputChange} className="w-full border border-brandSecondary rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brandSecondary/50 text-black bg-white">
                <option value="">None</option>
                {[1, 2, 3, 4].map(yr => <option key={yr} value={yr}>{yr}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
           <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Subjects of Interest</label>
             <div className="relative">
               <select onChange={handleAddSubject} className="w-full border-2 border-brandSecondary rounded-xl px-4 py-2 appearance-none cursor-pointer bg-white text-black font-medium focus:outline-none text-sm">
                  <option value="">Select Subjects (+)</option>
                  {allSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
               </select>
               <Plus className="absolute right-4 top-2.5 w-4 h-4 text-brandSecondary pointer-events-none" />
             </div>
           </div>

           <div className="flex-1 min-h-[100px] bg-gray-50 rounded-xl p-3 border border-gray-100 overflow-y-auto">
              {selectedSubjects.length === 0 && <p className="text-gray-400 text-xs text-center mt-4">Selected subjects will appear here.</p>}
              {selectedSubjects.map((sub, index) => (
                 <div key={index} className="mb-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                       <span className="font-semibold text-black text-xs">{sub.name}</span>
                       <button onClick={() => handleRemoveSubject(index)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold w-16 text-brandSecondary uppercase">{getLevelLabel(sub.level)}</span>
                       <input type="range" min="1" max="3" step="1" value={sub.level} onChange={(e) => handleSliderChange(index, e.target.value)} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brandSecondary" />
                    </div>
                 </div>
              ))}
           </div>

           <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Learning Style</label>
             <select name="learningStyle" value={formDetails.learningStyle || ""} onChange={handleInputChange} className="w-full border border-brandSecondary rounded-xl px-4 py-2 bg-white text-black text-sm focus:outline-none">
                <option value="">Select Learning Style (None)</option>
                <option value="Visual">Visual (Images, diagrams)</option>
                <option value="Auditory">Auditory (Listening, discussing)</option>
                <option value="Reading">Reading/Writing</option>
                <option value="Kinesthetic">Kinesthetic (Hands-on)</option>
             </select>
           </div>

           <div className="border border-brandSecondary rounded-xl p-3 bg-white">
              <p className="text-xs text-gray-500 mb-2 font-medium">Preferred Study Days</p>
              <div className="flex justify-between gap-1 mb-3">
                {daysOfWeek.map(day => (
                  <button key={day} onClick={() => toggleDay(day)} className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center transition-all border ${selectedDays.includes(day) ? 'bg-brandSecondary text-white border-brandSecondary shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}>{day}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex-1 relative">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 block ml-1">From</span>
                        {timeFrom && <button onClick={clearTimeFrom} className="text-[10px] text-red-500 hover:underline mr-1">Clear</button>}
                    </div>
                    <input type="time" value={timeFrom || ""} onChange={(e) => setTimeFrom(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none text-black" />
                 </div>
                 <span className="text-black font-bold mt-3">-</span>
                 <div className="flex-1 relative">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 block ml-1">To</span>
                        {timeTo && <button onClick={clearTimeTo} className="text-[10px] text-red-500 hover:underline mr-1">Clear</button>}
                    </div>
                    <input type="time" value={timeTo || ""} onChange={(e) => setTimeTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none text-black" />
                 </div>
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Preferred Group Size</label>
              <input name="groupSize" value={formDetails.groupSize || ""} onChange={handleInputChange} type="text" placeholder="Enter a group size" className="w-full border border-brandSecondary rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brandSecondary/50 text-black" />
           </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end items-center shrink-0">
         {/* ✨ Inline Error Message */}
         {errorMessage && <p className="text-red-500 text-sm font-bold mr-4">{errorMessage}</p>}
         
         <button 
           onClick={handleSave} 
           disabled={isSaving}
           className={`text-white px-12 py-2 rounded-full text-lg font-medium shadow-md transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-brandPrimary hover:bg-blue-900'}`}
         >
           {isSaving ? 'Saving...' : 'Save & Continue'}
         </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Save } from 'lucide-react';

const ProfileSummary = () => {
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [formDetails, setFormDetails] = useState({ fullName: '', degree: '', specialization: '', semester: '', year: '', learningStyle: '', groupSize: '' });
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [progress, setProgress] = useState(0);

  // ✨ REAL BACKEND FETCH ✨
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // Load basic info from login/register as fallback
      setProfileData({ 
        username: localStorage.getItem("userName") || 'User', 
        email: localStorage.getItem("userEmail") || 'user@example.com' 
      });

      if (!token || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8082/api/users/${userId}/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Map backend data to our form state
          setFormDetails({
            fullName: data.fullName || '',
            degree: data.degree || '',
            specialization: data.specialization || '',
            semester: data.semester || '',
            year: data.year || '',
            learningStyle: data.learningStyle || '',
            groupSize: data.groupSize || ''
          });
          setSelectedSubjects(data.selectedSubjects || []);
          setSelectedDays(data.selectedDays || []);
          setTimeFrom(data.timeFrom || '');
          setTimeTo(data.timeTo || '');
        }
      } catch (error) {
        console.error("Failed to load profile data from server", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Progress Bar calculation
  useEffect(() => {
    let completed = 0;
    const totalFields = 11; // Reduced to 11 since we removed image upload
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
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

  // --- SAVE BACK TO JAVA BACKEND ---
  const handleToggleEdit = async () => {
    if (isGlobalEditing) {
        const payload = { ...formDetails, selectedSubjects, selectedDays, timeFrom, timeTo };
        
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            const response = await fetch(`http://localhost:8082/api/users/${userId}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            
            if(response.ok) {
              console.log("Saved to backend!");
            } else {
              console.error("Failed to save changes");
            }
        } catch(e) { 
          console.warn("Could not reach backend"); 
        }
        setIsGlobalEditing(false); 
    } else {
        setIsGlobalEditing(true);
    }
  };

  const allSubjects = [
    "Ad Hoc and Sensor Networks", "Advanced Algorithms", "Advanced Web Technology", "Agile Methodologies", "Artificial Intelligence", "Big Data Analytics", "Blockchain Technology", "Business Analytics", "C Programming", "Cloud Computing", "Compiler Design", "Computer Architecture", "Computer Graphics", "Computer Networks", "Computer Vision", "Cryptography and Network Security", "Cyber Security", "Data Analytics", "Data Science", "Data Structures", "Database Management Systems (DBMS)", "Deep Learning", "Design and Analysis of Algorithms", "Digital Logic and Design", "Discrete Mathematics", "Distributed Systems", "Engineering Chemistry", "Engineering Graphics", "Engineering Physics", "Ethics in Data Science", "Game Design", "Green Computing", "Human Computer Interaction", "Information Retrieval", "Information Security", "Internet of Things (IoT)", "Java Programming (OOPs)", "Linear Algebra", "Machine Learning", "Mobile App Development", "Multimedia Systems", "Natural Language Processing (NLP)", "Operating Systems", "Probability and Statistics", "Professional Ethics", "Python Programming", "Reinforcement Learning", "Social Network Analysis", "Software Engineering", "Software Project Management", "Software Testing", "Statistics for Data Science", "Theory of Computation", "User Interface Design (UI/UX)", "Virtual and Augmented Reality", "Web Development (Full Stack)", "Web Technology"
  ];
  
  const handleAddSubject = (e) => {
    const subjectName = e.target.value;
    if (subjectName && !selectedSubjects.find(s => s.name === subjectName)) setSelectedSubjects([...selectedSubjects, { name: subjectName, level: 1 }]);
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

  const getLevelLabel = (val) => val === 1 ? 'Basic' : val === 2 ? 'Intermediate' : 'Advanced';

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const toggleDay = (day) => {
    if (!isGlobalEditing) return;
    if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
    else setSelectedDays([...selectedDays, day]);
  };

  const clearTimeFrom = () => setTimeFrom('');
  const clearTimeTo = () => setTimeTo('');

  if (isLoading) {
    return <div className="h-full flex items-center justify-center font-bold text-gray-400">Loading Profile Data...</div>;
  }

  // ✨ Get the first letter for the static avatar
  const initialLetter = (formDetails.fullName || profileData.username || "U").charAt(0).toUpperCase();

  return (
    <div className="h-full bg-white font-sans overflow-hidden flex flex-col">
      <div className="mb-1 shrink-0 px-2 pt-0 flex justify-between items-end">
         <div>
             <h1 className="text-3xl font-extrabold text-black">Profile Summary</h1>
             <p className="text-gray-500 text-sm mt-1">{isGlobalEditing ? 'Edit your details below and save.' : 'View your profile details.'}</p>
         </div>
         <div className="flex flex-col items-end mb-1">
             <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brandSecondary transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-brandSecondary">{progress}% Completed</span>
             </div>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-y-auto pb-4 px-2">
        <div className="flex flex-col gap-3">
          <div className={`border-2 ${isGlobalEditing ? 'border-brandSecondary' : 'border-gray-200'} rounded-2xl p-4 relative flex items-center gap-4 shrink-0 mb-2 transition-colors`}>
             
             {/* ✨ STATIC AVATAR */}
             <div className="w-20 h-20 rounded-full border-2 border-brandSecondary bg-gray-100 flex items-center justify-center text-brandSecondary font-bold text-4xl shrink-0">
                {initialLetter}
             </div>
             
             <div className="overflow-hidden w-full pr-6">
                <div className="flex flex-col gap-1">
                    <input name="username" value={profileData.username || ""} onChange={handleProfileChange} disabled={!isGlobalEditing} className={`outline-none text-sm font-bold w-full bg-transparent ${isGlobalEditing ? 'border-b border-gray-300' : ''}`} placeholder="Username" />
                    <input name="email" value={profileData.email || ""} onChange={handleProfileChange} disabled={!isGlobalEditing} className={`outline-none text-xs text-gray-600 w-full bg-transparent ${isGlobalEditing ? 'border-b border-gray-300' : ''}`} placeholder="Email" />
                </div>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Full Name</label>
            <input name="fullName" value={formDetails.fullName || ""} onChange={handleInputChange} type="text" disabled={!isGlobalEditing} placeholder="Enter your full name" className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Degree</label>
            <select name="degree" value={formDetails.degree || ""} onChange={handleInputChange} disabled={!isGlobalEditing} className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`}>
              <option value="">Select Degree (None)</option>
              <option value="BE">Bachelor of Engineering (B.E.)</option>
              <option value="BTech">Bachelor of Technology (B.Tech)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Specialization</label>
            <select name="specialization" value={formDetails.specialization || ""} onChange={handleInputChange} disabled={!isGlobalEditing} className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`}>
              <option value="">Select Specialization (None)</option>
              <option value="CSE">Computer Science and Engineering (CSE)</option>
              <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
              <option value="IT">Information Technology (IT)</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Semester</label>
              <select name="semester" value={formDetails.semester || ""} onChange={handleInputChange} disabled={!isGlobalEditing} className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                <option value="">None</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Year</label>
              <select name="year" value={formDetails.year || ""} onChange={handleInputChange} disabled={!isGlobalEditing} className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                <option value="">None</option>
                {[1, 2, 3, 4].map(yr => <option key={yr} value={yr}>{yr}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
           {isGlobalEditing && (
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Add Subjects</label>
                 <div className="relative">
                   <select onChange={handleAddSubject} className="w-full border-2 border-brandSecondary rounded-xl px-4 py-2 appearance-none cursor-pointer bg-white text-black font-medium focus:outline-none text-sm">
                      <option value="">Select Subjects (+)</option>
                      {allSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                   </select>
                   <Plus className="absolute right-4 top-2.5 w-4 h-4 text-brandSecondary pointer-events-none" />
                 </div>
               </div>
           )}
           
           <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Subjects of Interest</label>
                <div className={`flex-1 min-h-[100px] rounded-xl p-3 border overflow-y-auto ${isGlobalEditing ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                    {selectedSubjects.length === 0 && <p className="text-gray-400 text-xs text-center mt-4">No subjects selected.</p>}
                    {selectedSubjects.map((sub, index) => (
                        <div key={index} className="mb-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-black text-xs">{sub.name}</span>
                            {isGlobalEditing && (
                                <button onClick={() => handleRemoveSubject(index)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                            )}
                            </div>
                            <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-16 text-brandSecondary uppercase">{getLevelLabel(sub.level)}</span>
                            <input type="range" min="1" max="3" step="1" value={sub.level} onChange={(e) => handleSliderChange(index, e.target.value)} disabled={!isGlobalEditing} className={`w-full h-1.5 rounded-lg appearance-none accent-brandSecondary ${isGlobalEditing ? 'cursor-pointer bg-gray-200' : 'bg-gray-100'}`} />
                            </div>
                        </div>
                    ))}
                </div>
           </div>

           <div>
             <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Learning Style</label>
             <select name="learningStyle" value={formDetails.learningStyle || ""} onChange={handleInputChange} disabled={!isGlobalEditing} className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                <option value="">Select Learning Style (None)</option>
                <option value="Visual">Visual (Images, diagrams)</option>
                <option value="Auditory">Auditory (Listening, discussing)</option>
                <option value="Reading">Reading/Writing</option>
                <option value="Kinesthetic">Kinesthetic (Hands-on)</option>
             </select>
           </div>

           <div className={`border rounded-xl p-3 ${isGlobalEditing ? 'border-brandSecondary bg-white' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs text-gray-500 mb-2 font-medium">Preferred Study Days</p>
              <div className="flex justify-between gap-1 mb-3">
                {daysOfWeek.map(day => (
                  <button key={day} onClick={() => toggleDay(day)} disabled={!isGlobalEditing} className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center transition-all border ${selectedDays.includes(day) ? 'bg-brandSecondary text-white border-brandSecondary shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200'} ${!isGlobalEditing && !selectedDays.includes(day) ? 'opacity-50' : ''}`}>{day}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex-1 relative">
                     <div className="flex justify-between items-center">
                         <span className="text-[10px] text-gray-400 block ml-1">From</span>
                         {isGlobalEditing && timeFrom && <button onClick={clearTimeFrom} className="text-[10px] text-red-500 hover:underline mr-1">Clear</button>}
                     </div>
                     <input type="time" value={timeFrom || ""} onChange={(e) => setTimeFrom(e.target.value)} disabled={!isGlobalEditing} className={`w-full border rounded-lg px-2 py-1 text-sm outline-none text-black ${isGlobalEditing ? 'border-gray-200' : 'border-transparent bg-transparent'}`} />
                 </div>
                 <span className="text-black font-bold mt-3">-</span>
                 <div className="flex-1 relative">
                     <div className="flex justify-between items-center">
                         <span className="text-[10px] text-gray-400 block ml-1">To</span>
                         {isGlobalEditing && timeTo && <button onClick={clearTimeTo} className="text-[10px] text-red-500 hover:underline mr-1">Clear</button>}
                     </div>
                     <input type="time" value={timeTo || ""} onChange={(e) => setTimeTo(e.target.value)} disabled={!isGlobalEditing} className={`w-full border rounded-lg px-2 py-1 text-sm outline-none text-black ${isGlobalEditing ? 'border-gray-200' : 'border-transparent bg-transparent'}`} />
                 </div>
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Preferred Group Size</label>
              <input name="groupSize" value={formDetails.groupSize || ""} onChange={handleInputChange} disabled={!isGlobalEditing} type="text" placeholder="Enter a group size" className={`w-full border rounded-xl px-4 py-2 text-sm outline-none text-black ${isGlobalEditing ? 'border-brandSecondary focus:ring-2 focus:ring-brandSecondary/50 bg-white' : 'border-gray-200 bg-gray-50'}`} />
           </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end shrink-0 pt-2 border-t border-gray-100">
         <button onClick={handleToggleEdit} className={`${isGlobalEditing ? 'bg-brandSecondary hover:bg-teal-600' : 'bg-brandPrimary hover:bg-blue-900'} text-white px-8 py-2 rounded-full text-lg font-medium transition-all shadow-md flex items-center gap-2`}>
           {isGlobalEditing ? <><Save size={18} /> Save Changes</> : <><Edit size={18} /> Edit Profile</>}
         </button>
      </div>
    </div>
  );
};

export default ProfileSummary;
import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check, X, User, Calendar, Clock, Target, BarChart2 } from 'lucide-react';

const FindGroups = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // --- STATE MANAGEMENT ---
  const [allGroups, setAllGroups] = useState([]);
  
  // Filter States
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSkillLevel, setFilterSkillLevel] = useState('');
  const [filterStudyGoal, setFilterStudyGoal] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [joinSuccessMsg, setJoinSuccessMsg] = useState(''); 
  const [errorMsg, setErrorMsg] = useState('');
  
  const dayDropdownRef = useRef(null);

  // Fetch all on initial load
  useEffect(() => {
    fetchAllGroups();
  }, []);

  // ✨ UPDATED: Direct endpoint with userId and no mapping needed ✨
  const fetchAllGroups = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/groups/all/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllGroups(data); // Backend DTO perfectly matches frontend state!
      }
    } catch (err) { console.error(err); }
  };

  // ✨ UPDATED: Search endpoint with userId ✨
  const handleApplyFilters = async () => {
    try {
        const params = new URLSearchParams();
        if (filterSubject && filterSubject !== "Any") params.append("subject", filterSubject);
        if (filterSkillLevel && filterSkillLevel !== "Any") params.append("skillLevel", filterSkillLevel);
        if (filterStudyGoal && filterStudyGoal !== "Any") params.append("studyGoal", filterStudyGoal);
        if (filterSize && filterSize !== "Any") params.append("size", filterSize);
        if (selectedDays.length > 0) params.append("days", selectedDays.join(","));

        const response = await fetch(`http://localhost:8082/api/groups/search/${userId}?${params.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            setAllGroups(data);
        }
    } catch (err) {
        console.error("Filter Search Failed:", err);
    }
  };

  // --- HANDLERS ---
  const toggleDay = (day) => {
    if (day === "Any") { setSelectedDays([]); return; }
    if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
    else setSelectedDays([...selectedDays, day]);
  };

  const handleJoinGroup = async (groupId, groupName) => {
    try {
        const response = await fetch(`http://localhost:8082/api/groups/${groupId}/join/${userId}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            setJoinSuccessMsg(`Successfully joined ${groupName}! Check 'My Groups'.`);
            setSelectedGroup(null); 
            handleApplyFilters(); // Refresh list via filters to keep accurate scores/counts
            setTimeout(() => setJoinSuccessMsg(''), 4000);
        } else {
            const errorText = await response.text();
            setErrorMsg(errorText);
            setTimeout(() => setErrorMsg(''), 4000);
        }
    } catch (err) { setErrorMsg("Failed to connect to server."); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target)) setIsDayDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSubjects = [
    "Ad Hoc and Sensor Networks", "Advanced Algorithms", "Advanced Web Technology", "Agile Methodologies", 
    "Artificial Intelligence", "Big Data Analytics", "Blockchain Technology", "Business Analytics", "C Programming", 
    "Cloud Computing", "Compiler Design", "Computer Architecture", "Computer Graphics", "Computer Networks", 
    "Computer Vision", "Cryptography and Network Security", "Cyber Security", "Data Analytics", "Data Science", 
    "Data Structures", "Database Management Systems (DBMS)", "Deep Learning", "Design and Analysis of Algorithms", 
    "Digital Logic and Design", "Discrete Mathematics", "Distributed Systems", "Engineering Chemistry", 
    "Engineering Graphics", "Engineering Physics", "Ethics in Data Science", "Game Design", "Green Computing", 
    "Human Computer Interaction", "Information Retrieval", "Information Security", "Internet of Things (IoT)", 
    "Java Programming (OOPs)", "Linear Algebra", "Machine Learning", "Mobile App Development", "Multimedia Systems", 
    "Natural Language Processing (NLP)", "Operating Systems", "Probability and Statistics", "Professional Ethics", 
    "Python Programming", "Reinforcement Learning", "Social Network Analysis", "Software Engineering", 
    "Software Project Management", "Software Testing", "Statistics for Data Science", "Theory of Computation", 
    "User Interface Design (UI/UX)", "Virtual and Augmented Reality", "Web Development (Full Stack)", "Web Technology"
  ];
  const studyGoals = ["Concept Understanding", "Exam Preparation", "Revision & Practice", "Project / Assignment Support", "Skill Improvement", "Doubt Clearing"];
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col h-full relative">
      
      {joinSuccessMsg && (
        <div className="fixed top-6 right-6 bg-[#1ABC9C] text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <Check size={20} /> <span className="font-bold">{joinSuccessMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <X size={20} /> <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4 text-black">Discover groups that match you</h2>
      
      {/* FILTER BAR */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
             {/* 1. Subject */}
             <div className="flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Subject</label>
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none bg-white text-black">
                    <option value="Any">Any</option>
                    {allSubjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                </select>
             </div>
             
             {/* 2. Skill Level */}
             <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Skill Level</label>
                <select value={filterSkillLevel} onChange={(e) => setFilterSkillLevel(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none bg-white text-black">
                    <option value="Any">Any</option><option>Basic</option><option>Intermediate</option><option>Advanced</option>
                </select>
             </div>

             {/* 3. Study Goal */}
             <div className="flex-1 min-w-[160px]">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Study Goal</label>
                <select value={filterStudyGoal} onChange={(e) => setFilterStudyGoal(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none bg-white text-black">
                    <option value="Any">Any</option>
                    {studyGoals.map((goal, idx) => <option key={idx} value={goal}>{goal}</option>)}
                </select>
             </div>

             {/* 4. Group Size */}
             <div className="w-[100px]">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Size</label>
                <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)} className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none bg-white text-black">
                    <option value="Any">Any</option>
                    {[2,3,4,5,6,7,8,9,10].map(num => <option key={num} value={num}>{num}</option>)}
                    <option value="10+">10+</option>
                </select>
             </div>

             {/* 5. Preferred Days */}
             <div className="flex-1 min-w-[150px] relative" ref={dayDropdownRef}>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Preferred Days</label>
                <button onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)} className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none bg-white text-left flex justify-between items-center text-black">
                    <span className="truncate">{selectedDays.length === 0 ? "Any" : `${selectedDays.length} selected`}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                </button>
                {isDayDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 max-h-60 overflow-y-auto">
                        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-black" onClick={() => { setSelectedDays([]); setIsDayDropdownOpen(false); }}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedDays.length === 0 ? 'bg-[#1ABC9C] border-[#1ABC9C]' : 'border-gray-300'}`}>
                                {selectedDays.length === 0 && <Check size={10} className="text-white" />}
                            </div>
                            <span>Any</span>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        {daysOfWeek.map(day => (
                            <div key={day} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-black" onClick={() => toggleDay(day)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedDays.includes(day) ? 'bg-[#1ABC9C] border-[#1ABC9C]' : 'border-gray-300'}`}>
                                    {selectedDays.includes(day) && <Check size={10} className="text-white" />}
                                </div>
                                <span>{day}</span>
                            </div>
                        ))}
                    </div>
                )}
             </div>
             
             <button onClick={handleApplyFilters} className="bg-[#1ABC9C] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#16a085] flex items-center justify-center gap-2 h-10 w-full lg:w-auto">
                <Filter size={16} /> Apply
             </button>
        </div>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
        {allGroups.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10 font-bold">No groups found. Try adjusting your filters!</div>
        ) : (
            allGroups.map((group) => (
                <div key={group.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-gray-800 truncate pr-2">{group.name}</h3>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold border border-green-200 shrink-0">{group.score} Match</span>
                    </div>
                    
                    <div className="space-y-2 mb-6 flex-1">
                        <p className="text-sm flex items-center gap-2">
                            <span className="font-semibold text-gray-600 w-20">Subject:</span> 
                            <span className="text-black truncate">{group.subject}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                            <span className="font-semibold text-gray-600 w-20">Level:</span> 
                            <span className="text-black bg-gray-100 px-2 py-0.5 rounded text-xs uppercase font-bold">{group.level}</span>
                        </p>
                    </div>

                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleJoinGroup(group.id, group.name)} className="flex-1 bg-[#1ABC9C] text-white py-2 rounded-lg font-medium hover:bg-[#16a085] text-sm transition-colors">Join Group</button>
                        <button onClick={() => setSelectedGroup(group)} className="flex-1 border border-[#1ABC9C] text-[#1ABC9C] py-2 rounded-lg font-medium hover:bg-teal-50 text-sm transition-colors">View Details</button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* DETAILS MODAL */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="bg-[#1e3a8a] p-6 text-white flex justify-between items-start shrink-0 relative">
                    <div>
                        <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-2 mt-2 text-blue-200 text-sm">
                            <span>Since {selectedGroup.creationDate}</span>
                            <span>•</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-white">{selectedGroup.score} Compatible</span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGroup(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
                        <h3 className="text-green-800 font-bold mb-3 flex items-center gap-2">
                            <BarChart2 size={18} /> Compatibility Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-green-600 text-xs font-semibold uppercase">Subject Match</p>
                                <p className="font-bold text-gray-800">{selectedGroup.compatibility.subject}</p>
                            </div>
                            <div>
                                <p className="text-green-600 text-xs font-semibold uppercase">Skill Balance</p>
                                <p className="font-bold text-gray-800">{selectedGroup.compatibility.skill}</p>
                            </div>
                            <div>
                                <p className="text-green-600 text-xs font-semibold uppercase">Schedule</p>
                                <p className="font-bold text-gray-800">{selectedGroup.compatibility.schedule}</p>
                            </div>
                            <div>
                                <p className="text-green-600 text-xs font-semibold uppercase">Overall</p>
                                <p className="font-bold text-gray-800">{selectedGroup.compatibility.overall}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Target size={16} className="text-[#1ABC9C]"/> Study Goal</h4>
                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedGroup.goal}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Clock size={16} className="text-[#1ABC9C]"/> Session Details</h4>
                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedGroup.sessionDetails}</p>
                        </div>
                    </div>

                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><User size={16} className="text-[#1ABC9C]"/> Team Members ({selectedGroup.currentMembers}/{selectedGroup.maxMembers})</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 border-b">
                                <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Skill Level</th></tr>
                            </thead>
                            <tbody>
                                {selectedGroup.membersList.map((member, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-3 text-gray-800 font-medium">{member.name}</td>
                                        <td className="p-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${member.role === 'Creator' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{member.role}</span>
                                        </td>
                                        <td className="p-3 text-gray-600">{member.level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={() => handleJoinGroup(selectedGroup.id, selectedGroup.name)} className="w-full bg-[#1ABC9C] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#16a085] shadow-md transition-colors">
                        Join Group
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FindGroups;
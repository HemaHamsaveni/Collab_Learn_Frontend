import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Calendar, User, BookOpen, Clock, Target, Check, LogOut, ChevronDown, MessageCircle, Trash2 } from 'lucide-react';

const MyGroups = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const styleDropdownRef = useRef(null);

  const [createDays, setCreateDays] = useState([]);
  const [createTimeFrom, setCreateTimeFrom] = useState('');
  const [createTimeTo, setCreateTimeTo] = useState('');

  const [newGroup, setNewGroup] = useState({
    name: '', subject: '', membersCount: '', studyGoal: '', learningStyle: [], skillLevel: 'Intermediate'
  });

  // --- TIME FORMATTER (24h to 12h AM/PM) ---
  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/groups/user/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        const formattedGroups = data.map(g => {
            const daysStr = g.sessionDays?.join(', ') || '';
            // Apply 12-hour formatting here!
            const startTime = formatTime12hr(g.sessionTimeFrom);
            const endTime = formatTime12hr(g.sessionTimeTo);
            const timeStr = (startTime || endTime) ? `${startTime} - ${endTime}` : '';
            
            return {
                id: g.id,
                name: g.name,
                subject: g.subject,
                role: g.admin.id === Number(userId) ? "Creator" : "Member",
                members: g.members.length,
                totalMembers: g.maxCapacity,
                createdOn: new Date(g.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                goal: g.studyGoal,
                sessionDetails: daysStr && timeStr ? `${daysStr} • ${timeStr}` : (daysStr || timeStr || "TBD"),
                membersList: g.members.map(m => ({
                    name: m.name,
                    role: m.id === g.admin.id ? "Creator" : "Member",
                    skill: m.id === g.admin.id ? g.skillLevel : "Pending" 
                }))
            };
        });
        setGroups(formattedGroups);
      }
    } catch (err) { console.error("Failed to fetch groups", err); }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const payload = {
        ...newGroup,
        sessionDays: createDays,
        sessionTimeFrom: createTimeFrom,
        sessionTimeTo: createTimeTo,
        adminId: userId
    };

    try {
      const response = await fetch("http://localhost:8082/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowCreateModal(false);
        showToast(`Successfully created ${newGroup.name}`);
        setNewGroup({ name: '', subject: '', membersCount: '', studyGoal: '', learningStyle: [], skillLevel: 'Intermediate' });
        setCreateDays([]); setCreateTimeFrom(''); setCreateTimeTo('');
        fetchUserGroups(); 
      } else { alert(await response.text()); }
    } catch (err) { console.error(err); }
  };

  const handleLeaveGroup = async (group) => {
    if (window.confirm(`Are you sure you want to leave "${group.name}"?`)) {
        try {
            const response = await fetch(`http://localhost:8082/api/groups/${group.id}/leave/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                setShowDetailsModal(false);
                showToast(`Left group ${group.name}`);
                fetchUserGroups(); 
            } else { alert(await response.text()); }
        } catch(err) { console.error(err); }
    }
  };

  // ✨ NEW: Handle Delete Group ✨
  const handleDeleteGroup = async (group) => {
    if (window.confirm(`WARNING: Are you sure you want to permanently delete "${group.name}"? This action cannot be undone.`)) {
        try {
            const response = await fetch(`http://localhost:8082/api/groups/${group.id}/delete/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                setShowDetailsModal(false);
                showToast(`Deleted group ${group.name}`);
                fetchUserGroups(); 
            } else { alert(await response.text()); }
        } catch(err) { console.error(err); }
    }
  };

  const openDetails = (group) => { setSelectedGroup(group); setShowDetailsModal(true); };
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };
  const handleInputChange = (e) => setNewGroup({ ...newGroup, [e.target.name]: e.target.value });
  
  const toggleLearningStyle = (style) => {
    const current = newGroup.learningStyle;
    setNewGroup({ ...newGroup, learningStyle: current.includes(style) ? current.filter(s => s !== style) : [...current, style] });
  };
  const toggleCreateDay = (day) => setCreateDays(createDays.includes(day) ? createDays.filter(d => d !== day) : [...createDays, day]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) setIsStyleDropdownOpen(false);
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
  const learningStylesList = ["Visual (Images, diagrams)", "Auditory (Listening, discussing)", "Reading/Writing", "Kinesthetic (Hands-on)"];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full relative">
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-[#1ABC9C] text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <Check size={20} /> <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-black">Manage your study groups</h2>
            <p className="text-sm text-gray-500">You are part of <span className="text-[#1ABC9C] font-extrabold text-lg">{groups.length}</span> groups</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-[#1e3a8a] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#172554] flex items-center gap-2 shadow-lg">
            <Plus size={18} /> Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
            <div key={group.id} className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-[#1ABC9C] transition-colors flex flex-col shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-3">{group.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
                    <p><span className="font-semibold text-black">Subject:</span> {group.subject}</p>
                    <p><span className="font-semibold text-black">Role:</span> <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${group.role === 'Creator' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{group.role}</span></p>
                    <p><span className="font-semibold text-black">{group.role === 'Creator' ? 'Created on:' : 'Joined on:'}</span> {group.createdOn}</p>
                </div>
                <div className="flex gap-3 mt-auto">
                    <button onClick={() => openDetails(group)} className="flex-1 border border-[#1ABC9C] text-[#1ABC9C] py-2 rounded-lg text-sm font-medium hover:bg-teal-50">View Details</button>
                    
                    {/* ✨ Conditionally Render Delete or Leave based on Role ✨ */}
                    {group.role === 'Creator' ? (
                        <button onClick={() => handleDeleteGroup(group)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg text-sm font-medium hover:bg-red-100">Delete Group</button>
                    ) : (
                        <button onClick={() => handleLeaveGroup(group)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg text-sm font-medium hover:bg-red-100">Leave Group</button>
                    )}
                </div>
            </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">Create New Group</h2>
                    <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleCreateGroup} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Group Name</label>
                        <input required name="name" value={newGroup.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#1ABC9C]" placeholder="e.g. Java Masters" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Subject</label>
                        <select required name="subject" value={newGroup.subject} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#1ABC9C] bg-white text-black">
                            <option value="">Select Subject</option>
                            {allSubjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Max Members</label>
                            <input required name="membersCount" type="number" value={newGroup.membersCount} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#1ABC9C]" placeholder="e.g. 5" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Skill Level</label>
                            <select name="skillLevel" value={newGroup.skillLevel} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#1ABC9C] bg-white text-black">
                                <option>Basic</option><option>Intermediate</option><option>Advanced</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="border border-gray-300 rounded-xl p-3 bg-white">
                        <p className="text-xs text-gray-500 mb-2 font-bold">Session Details (Days & Time)</p>
                        <div className="flex justify-between gap-1 mb-3">
                            {daysOfWeek.map(day => (
                                <button type="button" key={day} onClick={() => toggleCreateDay(day)} className={`w-8 h-8 rounded-full text-[10px] font-bold border ${createDays.includes(day) ? 'bg-[#1ABC9C] text-white border-[#1ABC9C] shadow-sm scale-105' : 'bg-white text-gray-500 border-gray-200'}`}>{day}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-400 block mb-1">From</span>
                                <input type="time" value={createTimeFrom} onChange={(e) => setCreateTimeFrom(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none text-black" />
                            </div>
                            <span className="mt-4 font-bold">-</span>
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-400 block mb-1">To</span>
                                <input type="time" value={createTimeTo} onChange={(e) => setCreateTimeTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none text-black" />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Study Goal</label>
                        <select required name="studyGoal" value={newGroup.studyGoal} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#1ABC9C] bg-white text-black">
                            <option value="">Select Goal</option>
                            {studyGoals.map((goal, idx) => <option key={idx} value={goal}>{goal}</option>)}
                        </select>
                    </div>

                    <div className="relative" ref={styleDropdownRef}>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Learning Style (Multi-select)</label>
                        <button type="button" onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)} className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#1ABC9C] bg-white text-left flex justify-between items-center">
                            <span className="truncate text-gray-700">{newGroup.learningStyle.length === 0 ? "Select Learning Styles" : newGroup.learningStyle.join(", ")}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        {isStyleDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 max-h-40 overflow-y-auto">
                                {learningStylesList.map((style, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm" onClick={() => toggleLearningStyle(style)}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${newGroup.learningStyle.includes(style) ? 'bg-[#1ABC9C] border-[#1ABC9C]' : 'border-gray-300'}`}>
                                            {newGroup.learningStyle.includes(style) && <Check size={10} className="text-white" />}
                                        </div>
                                        <span>{style}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button type="submit" className="w-full bg-[#1ABC9C] text-white py-3 rounded-xl font-bold mt-4 hover:bg-[#16a085] shadow-md">Create Group</button>
                </form>
            </div>
        </div>
      )}

      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-[#1e3a8a] p-6 text-white flex items-start gap-4 relative shrink-0">
                    <button onClick={() => setShowDetailsModal(false)} className="absolute top-6 left-6 hover:bg-white/20 p-1 rounded-full"><X size={24} /></button>
                    <div className="ml-10 w-full">
                        <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-blue-200">
                            <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 text-white font-medium"><BookOpen size={14} /> {selectedGroup.subject}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Created: {selectedGroup.createdOn}</span>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-2"><Target size={16} className="text-[#1ABC9C]"/> Study Goal</h4>
                            <p className="font-medium text-gray-900">{selectedGroup.goal}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-2"><Clock size={16} className="text-[#1ABC9C]"/> Session Details</h4>
                            <p className="font-medium text-gray-900">{selectedGroup.sessionDetails}</p>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2"><User size={18} className="text-[#1ABC9C]"/> Team Members</h4>
                            <span className="text-sm font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">{selectedGroup.members} / {selectedGroup.totalMembers} Members</span>
                        </div>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                                    <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Skill Level</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedGroup.membersList?.map((member, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-3 text-gray-800 font-medium">{member.name}</td>
                                            <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-bold ${member.role === 'Creator' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{member.role}</span></td>
                                            <td className="p-3 text-gray-600">{member.skill}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={() => alert("Opening Group Chat...")} className="flex-1 bg-[#1ABC9C] text-white py-3 rounded-xl font-bold hover:bg-[#16a085] flex items-center justify-center gap-2"><MessageCircle size={18} /> Group Chat</button>
                        <button onClick={() => { setShowDetailsModal(false); navigate('/dashboard/schedule'); }} className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-xl font-bold hover:bg-[#172554] flex items-center justify-center gap-2"><Calendar size={18} /> View Schedule</button>
                    </div>

                    {/* ✨ Conditionally Render Delete/Leave at the bottom of the modal ✨ */}
                    <div className="pt-2">
                        <button 
                            onClick={() => selectedGroup.role === 'Creator' ? handleDeleteGroup(selectedGroup) : handleLeaveGroup(selectedGroup)}
                            className="w-full border-2 border-red-100 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {selectedGroup.role === 'Creator' ? <><Trash2 size={18} /> Delete Group</> : <><LogOut size={18} /> Leave Group</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MyGroups;
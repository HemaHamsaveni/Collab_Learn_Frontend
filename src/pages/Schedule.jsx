import React, { useState, useEffect } from 'react';
import { Clock, Video, X, FileText, Link as LinkIcon, Cpu, Calendar, CheckCircle, Sparkles, Plus } from 'lucide-react';

const Schedule = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [sessions, setSessions] = useState([]);
  const [adminGroups, setAdminGroups] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [summarySession, setSummarySession] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedSessionToComplete, setSelectedSessionToComplete] = useState(null);
  const [takeaways, setTakeaways] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSession, setNewSession] = useState({ groupId: '', topic: '', date: '', time: '', meetingLink: '' });

  // ✨ NEW: States for Toast Notifications
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };
  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 3000); };

  useEffect(() => {
    fetchAllUserSessions();
  }, []);

  const fetchAllUserSessions = async () => {
    setLoading(true);
    try {
      const groupRes = await fetch(`http://localhost:8082/api/groups/user/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (groupRes.ok) {
        const groups = await groupRes.json();
        const myAdminGroups = groups.filter(g => g.admin?.id === Number(userId));
        setAdminGroups(myAdminGroups);
        
        let allSessions = [];
        for (const group of groups) {
          const sessionRes = await fetch(`http://localhost:8082/api/sessions/group/${group.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (sessionRes.ok) {
            const groupSessions = await sessionRes.json();
            
            const mappedSessions = groupSessions.map(session => {
                const isCreator = session.studyGroup?.admin?.id === Number(userId);
                let userStatus = session.status;
                
                if (session.status === 'COMPLETED') {
                    const attended = session.attendees?.some(a => a.id === Number(userId));
                    if (!attended && !isCreator) {
                        userStatus = 'MISSED'; 
                    }
                } else if (session.status === 'CANCELLED') {
                    userStatus = 'MISSED';
                }

                return { ...session, userStatus, isCreator };
            });

            allSessions = [...allSessions, ...mappedSessions];
          }
        }
        
        allSessions.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
        setSessions(allSessions);
      }
    } catch (error) {
      console.error("Failed to load sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (session) => {
      window.open(session.meetingLink, '_blank'); 
      
      try {
          await fetch(`http://localhost:8082/api/sessions/${session.id}/attend/${userId}`, {
              method: 'POST',
              headers: { "Authorization": `Bearer ${token}` }
          });
          fetchAllUserSessions(); 
      } catch (err) {
          console.error("Failed to record attendance", err);
      }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const scheduledTime = `${newSession.date}T${newSession.time}:00`;
    const payload = { topic: newSession.topic, scheduledTime: scheduledTime, meetingLink: newSession.meetingLink };

    try {
        const response = await fetch(`http://localhost:8082/api/sessions/group/${newSession.groupId}`, {
            method: 'POST',
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            setCreateModalOpen(false);
            setNewSession({ groupId: '', topic: '', date: '', time: '', meetingLink: '' });
            showToast("Meeting scheduled successfully!");
            fetchAllUserSessions();
        } else {
            showError("Failed to schedule session.");
        }
    } catch (error) {
        showError("Server Error.");
    } finally {
        setIsCreating(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedSessionToComplete || !takeaways.trim()) return;
    setAiGenerating(true);
    try {
      const response = await fetch(`http://localhost:8082/api/sessions/${selectedSessionToComplete.id}/complete`, {
        method: 'POST',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ keyTakeaways: takeaways })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedSummary(data.aiSummary);
        showToast("Session completed and AI Summary generated!");
        fetchAllUserSessions(); 
      } else {
        showError("Failed to generate summary.");
      }
    } catch (error) {
      showError("Server Error.");
    } finally {
      setAiGenerating(false);
    }
  };

  const closeCompleteModal = () => {
    setCompleteModalOpen(false);
    setSelectedSessionToComplete(null);
    setTakeaways('');
    setGeneratedSummary('');
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return { date: 'TBD', time: 'TBD' };
    const d = new Date(isoString);
    return {
        date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (userStatus) => {
    if (userStatus === 'UPCOMING') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (userStatus === 'COMPLETED') return 'text-green-600 bg-green-50 border-green-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filters = ['All', 'UPCOMING', 'COMPLETED', 'MISSED'];
  const displayFilterName = (f) => f.charAt(0) + f.slice(1).toLowerCase();

  const filteredSessions = sessions.filter(session => {
    if (activeFilter === 'All') return true;
    return session.userStatus === activeFilter;
  });

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-400">Loading your schedule...</div>;

  return (
    <div className="h-full relative pb-4">
      {/* ✨ TOAST NOTIFICATIONS */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-[#1ABC9C] text-white px-6 py-3 rounded-xl shadow-lg z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle size={20} /> <span className="font-bold">{toastMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <X size={20} /> <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-black">Your Study Sessions</h2>
            <p className="text-sm text-gray-500">Manage meetings, links, and AI summaries.</p>
        </div>

        <div className="flex items-center gap-3">
            {adminGroups.length > 0 && (
                <button onClick={() => setCreateModalOpen(true)} className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#172554] flex items-center gap-2 shadow-sm transition-colors">
                    <Plus size={16} /> Schedule Meeting
                </button>
            )}

            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {filters.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeFilter === filter ? 'bg-[#1ABC9C] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {displayFilterName(filter)}
                    </button>
                ))}
            </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="font-bold">No {displayFilterName(activeFilter).toLowerCase()} sessions found.</p>
                <p className="text-xs mt-1">Sessions created by Group Leaders will appear here.</p>
            </div>
        ) : (
            filteredSessions.map(session => {
                const { date, time } = formatDateTime(session.scheduledTime);
                const groupName = session.studyGroup?.name || "Unknown Group";
                const subject = session.studyGroup?.subject || "General";

                return (
                  <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:border-[#1ABC9C] transition-colors">
                      <div className="flex-1 w-full">
                          <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-lg">{groupName}</h3>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(session.userStatus)}`}>
                                  {displayFilterName(session.userStatus)}
                              </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{subject} - <span className="font-medium text-gray-800">{session.topic}</span></p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1"><Clock size={14} /> {date}</span>
                              <span>{time}</span>
                          </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                          {session.userStatus === 'UPCOMING' ? (
                              <>
                                  {session.meetingLink ? (
                                    <button onClick={() => handleJoinSession(session)} className="flex-1 md:flex-none bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#172554] flex items-center justify-center gap-2">
                                        <Video size={16} /> Join Session
                                    </button>
                                  ) : (
                                    <button className="flex-1 md:flex-none bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
                                        <Video size={16} /> No Link
                                    </button>
                                  )}
                                  
                                  {session.isCreator && (
                                    <button 
                                      onClick={() => { setSelectedSessionToComplete(session); setCompleteModalOpen(true); }}
                                      className="flex-1 md:flex-none border border-[#1ABC9C] bg-[#1ABC9C]/10 text-[#1ABC9C] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1ABC9C] hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Finish
                                    </button>
                                  )}
                              </>
                          ) : (
                              <button 
                                  onClick={() => setSummarySession(session)}
                                  className="flex-1 md:flex-none border border-[#1ABC9C] text-[#1ABC9C] px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-50"
                              >
                                  View Details
                              </button>
                          )}
                      </div>
                  </div>
                );
            })
        )}
      </div>

      {/* CREATE SESSION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Calendar size={18}/> Schedule New Meeting</h2>
              <button onClick={() => setCreateModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Select Group</label>
                <select required value={newSession.groupId} onChange={(e) => setNewSession({...newSession, groupId: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] text-black bg-white">
                    <option value="" disabled>Choose a group you lead...</option>
                    {adminGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Discussion Topic</label>
                <input required type="text" placeholder="e.g., Chapter 4 Review" value={newSession.topic} onChange={(e) => setNewSession({...newSession, topic: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] text-black" />
              </div>
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                      <input required type="date" value={newSession.date} onChange={(e) => setNewSession({...newSession, date: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] text-black" />
                  </div>
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                      <input required type="time" value={newSession.time} onChange={(e) => setNewSession({...newSession, time: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] text-black" />
                  </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Meeting Link (Meet/Zoom)</label>
                <input required type="url" placeholder="https://meet.google.com/xyz" value={newSession.meetingLink} onChange={(e) => setNewSession({...newSession, meetingLink: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a] text-black" />
              </div>
              <button type="submit" disabled={isCreating} className={`w-full py-3 rounded-xl font-bold transition-colors mt-2 ${isCreating ? 'bg-gray-300 text-gray-500' : 'bg-[#1e3a8a] text-white hover:bg-[#172554]'}`}>
                {isCreating ? 'Scheduling...' : 'Post Meeting Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MARK COMPLETE & AI SUMMARY MODAL */}
      {completeModalOpen && selectedSessionToComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1e3a8a] p-5 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Sparkles size={18}/> Generate AI Summary</h2>
              <button onClick={closeCompleteModal} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="p-6">
              {!generatedSummary ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">You are completing the session <strong>"{selectedSessionToComplete.topic}"</strong>. Briefly type what your group discussed, and Gemini AI will generate a formatted revision summary for you.</p>
                  <textarea value={takeaways} onChange={(e) => setTakeaways(e.target.value)} placeholder="e.g. We covered the difference between interfaces and abstract classes in Java..." className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1ABC9C] min-h-[120px] resize-none mb-4 text-black" />
                  <button onClick={handleMarkComplete} disabled={aiGenerating || !takeaways.trim()} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${aiGenerating || !takeaways.trim() ? 'bg-gray-300 text-gray-500' : 'bg-[#1ABC9C] text-white hover:bg-[#16a085]'}`}>
                    {aiGenerating ? 'Generating AI Summary...' : 'Mark Complete & Generate'}
                  </button>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <h3 className="text-green-800 font-bold mb-2 flex items-center gap-2"><CheckCircle size={18}/> Session Completed!</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{generatedSummary}</p>
                  </div>
                  <button onClick={closeCompleteModal} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW PAST SUMMARY DETAILS MODAL */}
      {summarySession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="bg-[#1e3a8a] p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold">{summarySession.studyGroup?.name}</h2>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-white/30 bg-white/10`}>
                                {displayFilterName(summarySession.userStatus)}
                            </span>
                        </div>
                        <div className="text-blue-200 text-sm flex flex-col gap-1">
                            <span className="font-medium text-white">{summarySession.studyGroup?.subject} - {summarySession.topic}</span>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1"><Calendar size={12}/> {formatDateTime(summarySession.scheduledTime).date}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock size={12}/> {formatDateTime(summarySession.scheduledTime).time}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSummarySession(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-[#1ABC9C]" /> Main Topic
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                            <li>{summarySession.topic}</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                        <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                            <Cpu size={18} className="text-purple-600" /> 
                            {summarySession.status === 'COMPLETED' ? 'Generated AI Summary' : 'AI Summary Status'}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {summarySession.status === 'COMPLETED' 
                              ? (summarySession.aiSummary || "Summary is currently being generated or was not saved.")
                              : "This session was cancelled/missed, so no summary was generated."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
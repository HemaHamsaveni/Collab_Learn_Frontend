import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Flame, ArrowRight, Users, Zap } from 'lucide-react';

const DashboardHome = () => {
  const navigate = useNavigate();

  // 1. STATE TO HOLD DATABASE DATA
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 2. STATE TO HOLD REAL-TIME CLOCK
  const [currentTime, setCurrentTime] = useState(new Date());

  // ✨ 3. STATE FOR USER'S CUSTOM STREAK GOAL (Defaults to 5)
  const [streakGoal, setStreakGoal] = useState(() => {
    return Number(localStorage.getItem('userStreakGoal')) || 5;
  });

  // 4. FETCH REAL DATA FROM SPRING BOOT
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        navigate("/"); 
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
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // 5. START THE REAL-TIME CLOCK TICKER
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  const stats = {
    totalSessions: 45,
    completed: 32,
    left: 13
  };

  const upcomingSchedule = [
    { id: 1, date: "Today", time: "6:00 PM", subject: "Java Programming", group: "Java Masters" },
    { id: 2, date: "Tomorrow", time: "10:00 AM", subject: "DBMS", group: "DB Designers" },
    { id: 3, date: "Nov 20", time: "5:00 PM", subject: "Web Technology", group: "Web Dev Squad" },
  ];

  const myGroups = [
    { name: "Java Masters", subject: "Java Programming" },
    { name: "DB Designers", subject: "Database Management" },
    { name: "Web Dev Squad", subject: "Web Technology" },
  ];

  // ✨ CUSTOM GOAL HANDLER ✨
  const handleGoalChange = (e) => {
    const newGoal = Number(e.target.value);
    setStreakGoal(newGoal);
    localStorage.setItem('userStreakGoal', newGoal);
  };

  // ✨ CALCULATE STREAK PROGRESS ✨
  const actualStreak = profile?.streakCount || 1;
  // Math.min ensures the bar doesn't go over 100% if they pass their goal!
  const streakProgress = Math.min(Math.round((actualStreak / streakGoal) * 100), 100);

  if (loading) {
    return <div className="flex justify-center items-center h-64 font-bold text-brandSecondary text-xl">Loading your workspace...</div>;
  }

  return (
    <div className="space-y-6 pb-6">
      
      {/* 1. HEADER: REAL-TIME CLOCK AND DATE */}
      <div className="flex justify-between items-center mb-2">
         {/* LEFT: Live Time */}
         <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 font-bold flex items-center gap-2">
                <Clock className="text-brandSecondary" size={16} />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
         </div>
         {/* RIGHT: Live Date */}
         <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 font-bold flex items-center gap-2">
                <Calendar className="text-brandSecondary" size={16} />
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
         </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ✨ UPDATED: CUSTOM GOAL WIDGET ✨ */}
        <div className="bg-white p-6 rounded-2xl border border-brandSecondary shadow-sm flex flex-col justify-center">
           <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg flex items-center gap-2"><Flame className="text-orange-500" size={20}/> Days on Streak</h3>
              <span className="text-3xl font-extrabold text-brandSecondary">{actualStreak}</span>
           </div>
           
           <div className="mt-2">
              <div className="flex justify-between items-center text-xs text-gray-500 font-bold mb-1.5 px-1">
                 <span>Current</span>
                 {/* ✨ The hidden dropdown to set their goal! ✨ */}
                 <select 
                    value={streakGoal} 
                    onChange={handleGoalChange}
                    className="bg-gray-50 border border-gray-200 text-gray-600 rounded-md px-2 py-0.5 outline-none cursor-pointer hover:border-brandSecondary transition-colors focus:ring-1 focus:ring-brandSecondary text-xs font-bold"
                 >
                    <option value={5}>Goal: 5 Days</option>
                    <option value={10}>Goal: 10 Days</option>
                    <option value={20}>Goal: 20 Days</option>
                    <option value={30}>Goal: 30 Days</option>
                    <option value={50}>Goal: 50 Days</option>
                    <option value={100}>Goal: 100 Days</option>
                 </select>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-out" style={{ width: `${streakProgress}%` }}></div>
              </div>
              <p className="text-[11px] text-gray-400 mt-3 font-medium text-center">
                 {actualStreak >= streakGoal 
                    ? "🎉 Goal Reached! Time to set a higher one?" 
                    : actualStreak === 1 
                       ? "Great start! Come back tomorrow." 
                       : "You're on a roll! Keep the flame alive."}
              </p>
           </div>
        </div>

        {/* Study Progress */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle className="text-brandSecondary" size={20}/> Study Progress</h3>
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                 <p className="text-3xl font-bold text-blue-900">{stats.totalSessions}</p>
                 <p className="text-xs text-blue-600 font-bold uppercase mt-1">Total Sessions</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                 <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
                 <p className="text-xs text-green-600 font-bold uppercase mt-1">Completed</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                 <p className="text-3xl font-bold text-orange-900">{stats.left}</p>
                 <p className="text-xs text-orange-600 font-bold uppercase mt-1">Sessions Left</p>
              </div>
           </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: GROUPS & RESOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* My Groups List */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">My Groups</h3>
                <button onClick={() => navigate('/dashboard/my-groups')} className="text-sm text-brandSecondary font-bold hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myGroups.map((group, idx) => (
                    <div key={idx} className="border border-gray-200 p-4 rounded-xl hover:border-brandSecondary transition-colors cursor-pointer bg-gray-50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                           <Users size={16} className="text-brandSecondary" />
                           <h4 className="font-bold text-sm truncate text-gray-800">{group.name}</h4>
                        </div>
                        <p className="text-xs text-gray-500 pl-6">{group.subject}</p>
                    </div>
                ))}
                
                {/* Find More Placeholder */}
                <div onClick={() => navigate('/dashboard/find-groups')} className="border-2 border-dashed border-gray-300 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-brandSecondary hover:border-brandSecondary transition-all">
                    <p className="text-xs font-bold">+ Find More</p>
                </div>
            </div>
         </div>

         {/* RIGHT COLUMN: Study Resources & Discover */}
         <div className="flex flex-col gap-6">
             
             {/* Study Resources Card */}
             <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-2xl border border-teal-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-brandSecondary p-1.5 rounded-lg text-white">
                        <Zap size={18} />
                    </div>
                    <h3 className="font-bold text-gray-800">Study Resources</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">Generate materials or view your notes instantly.</p>
                <div className="flex gap-2">
                     <button onClick={() => navigate('/dashboard/resources')} className="flex-1 bg-white border border-brandSecondary text-brandSecondary py-2 rounded-lg text-xs font-bold hover:bg-teal-50 transition-colors">
                        Generate
                     </button>
                </div>
             </div>

             {/* Discover Groups Card */}
             <div className="bg-brandPrimary p-6 rounded-2xl text-white flex flex-col justify-center relative overflow-hidden flex-1">
                 <div className="relative z-10">
                     <h3 className="text-lg font-bold mb-1">Discover Groups</h3>
                     <p className="text-blue-200 text-xs mb-4">Find partners matching your style.</p>
                     <button onClick={() => navigate('/dashboard/find-groups')} className="bg-white text-brandPrimary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors w-fit">
                        Find Groups <ArrowRight size={14} />
                     </button>
                 </div>
                 {/* Decorative background circle */}
                 <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-900 rounded-full opacity-50"></div>
             </div>

         </div>
      </div>

      {/* 4. UPCOMING SCHEDULE TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">Upcoming Schedule</h3>
            <button onClick={() => navigate('/dashboard/schedule')} className="text-sm text-brandSecondary font-bold hover:underline">View Schedule</button>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-500 font-medium">
                     <tr>
                         <th className="p-4">Date</th>
                         <th className="p-4">Time</th>
                         <th className="p-4">Subject</th>
                         <th className="p-4">Group Name</th>
                         <th className="p-4">Action</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {upcomingSchedule.map((item) => (
                         <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                             <td className="p-4 font-bold text-gray-700 flex items-center gap-2"><Calendar size={14} /> {item.date}</td>
                             <td className="p-4 text-gray-600"><span className="flex items-center gap-1"><Clock size={14}/> {item.time}</span></td>
                             <td className="p-4 text-gray-900 font-medium">{item.subject}</td>
                             <td className="p-4 text-gray-500">{item.group}</td>
                             <td className="p-4">
                                 <button className="text-brandSecondary font-bold text-xs border border-brandSecondary px-3 py-1 rounded hover:bg-teal-50">Join</button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>

      {/* 5. QUOTE FOOTER */}
      <div className="text-center py-4">
          <p className="text-gray-400 italic text-sm">"Don't watch the clock; do what it does - keep going."</p>
      </div>

    </div>
  );
};

export default DashboardHome;
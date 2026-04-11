import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Book, RotateCw, Minimize2, Maximize2, Loader2 } from 'lucide-react';

const StudyResources = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Select an option above to start generating resources.' },
  ]);
  const [input, setInput] = useState('');
  const [chatStep, setChatStep] = useState(0); 
  const [mode, setMode] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [userSubjects, setUserSubjects] = useState([]);
  const [requestData, setRequestData] = useState({
    subject: '',
    topic: '',
    skillLevel: ''
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUserSubjects = async () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!userId) return;

        try {
            const response = await fetch(`http://localhost:8082/api/users/${userId}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.ok) {
                const profileData = await response.json();
                
                if (profileData.selectedSubjects && Array.isArray(profileData.selectedSubjects)) {
                    const extractedNames = profileData.selectedSubjects.map(item => {
                        if (typeof item === 'string') return item;
                        if (typeof item === 'object' && item !== null) {
                            return item.name || item.subject || item.subjectName || item.title || Object.values(item)[0] || "Unknown Topic"; 
                        }
                        return String(item);
                    });

                    const filteredNames = extractedNames.filter((name) => Boolean(name) && name.trim() !== "");
                    
                    if (filteredNames.length > 0) {
                        setUserSubjects(filteredNames);
                    } 
                } else if (profileData.interests && Array.isArray(profileData.interests)) {
                     setUserSubjects(profileData.interests.filter((name) => Boolean(name) && name.trim() !== ""));
                } 
            }
        } catch (err) {
            console.error("Failed to fetch user subjects:", err);
        }
    };
    fetchUserSubjects();
  }, []);

  const startChat = (selectedMode) => {
    setMode(selectedMode);
    setChatStep(1);
    setRequestData({ subject: '', topic: '', skillLevel: '' });
    
    let botGreeting = selectedMode === 'material' 
        ? 'Let\'s write a comprehensive Study Guide! 📚 What subject are we diving into today?' 
        : 'Let\'s create some rapid-fire Flash Cards! ⚡ What subject are we conquering today?';

    const newMessage = { type: 'bot', text: botGreeting };

    if (userSubjects.length > 0) {
        newMessage.options = userSubjects;
    } else {
        newMessage.text += " (Please type your subject in the chat box below to begin.)";
    }

    setMessages([newMessage]);
  };

  // ✨ UPDATED: Much stricter prompts
  const getAiInstruction = (currentMode, subject, topic, level, extraContext = "") => {
    if (currentMode === 'material') {
        return `You are an expert tutor creating a comprehensive study guide. 
                Subject: ${subject} | Topic: ${topic} | Level: ${level}. ${extraContext}
                CRITICAL INSTRUCTION: Write a detailed, conversational essay. DO NOT output a JSON array. DO NOT use JSON brackets. Write in normal readable paragraphs.`;
    } else {
        return `You are a quiz master generating flashcards.
                Subject: ${subject} | Topic: ${topic} | Level: ${level}. ${extraContext}
                CRITICAL INSTRUCTION: You MUST format response STRICTLY as a valid JSON array of objects with "title" and "content" keys. Return ONLY the JSON array without markdown code blocks.`;
    }
  };

  const fetchAiContent = async (payload) => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:8082/api/ai/generate", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        let rawText = await response.text();
        
        // Strip markdown wrappers (```json ... ```)
        const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        if (payload.materialType === 'flashcards') {
            try {
                const parsedData = JSON.parse(cleanedText);
                setMessages(prev => [...prev, { type: 'bot', text: 'Here are your flashcards:', data: parsedData }]);
            } catch (e) {
                setMessages(prev => [...prev, { type: 'bot', text: 'AI formatting error. Please try regenerating.' }]);
            }
        } else {
            // Mode is 'material' (Study Guide)
            let formattedText = rawText;

            // ✨ SMART FALLBACK: If the AI stubbornly returned JSON anyway, flatten it into beautiful paragraphs!
            if (cleanedText.startsWith('[') || cleanedText.startsWith('{')) {
                try {
                    const parsed = JSON.parse(cleanedText);
                    if (Array.isArray(parsed)) {
                        formattedText = parsed.map(item => {
                            const heading = item.title || item.topic || '';
                            const body = item.content || item.description || '';
                            return heading ? `📘 ${heading.toUpperCase()}\n${body}` : body;
                        }).join('\n\n');
                    }
                } catch(e) {
                    // Not valid JSON, which is fine! It will just render as normal text.
                }
            }

            // Strip basic markdown asterisks for cleaner reading
            formattedText = formattedText.replace(/\*\*/g, '');

            setMessages(prev => [...prev, { type: 'bot', text: formattedText }]);
        }
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: 'Error generating content.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Server connection error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (overrideText = null) => {
    const userText = typeof overrideText === 'string' ? overrideText : input;
    if (!userText.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userText }]);

    if (chatStep === 1) { 
        setRequestData(prev => ({ ...prev, subject: userText }));
        setTimeout(() => setMessages(prev => [...prev, { 
            type: 'bot', 
            text: `Excellent choice! 🎯 What specific topic within ${userText} should we focus on?` 
        }]), 600);
        setChatStep(2);
    } else if (chatStep === 2) { 
        setRequestData(prev => ({ ...prev, topic: userText }));
        setTimeout(() => setMessages(prev => [...prev, { 
            type: 'bot', 
            text: 'Lastly, what is your current comfort level?',
            options: ['Beginner 🌱', 'Intermediate 🚀', 'Advanced 🧠'] 
        }]), 600);
        setChatStep(3);
    } else if (chatStep === 3) { 
        const ai_instruction = getAiInstruction(mode, requestData.subject, requestData.topic, userText);
        const finalData = { 
            ...requestData, 
            skillLevel: userText, 
            materialType: mode === 'material' ? 'study_guide' : 'flashcards',
            instruction: ai_instruction
        };
        setRequestData(finalData);
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'bot', text: `Generating your ${mode === 'material' ? 'Study Guide' : 'Flash Cards'}... 🪄` }]);
            fetchAiContent(finalData);
        }, 600);
        setChatStep(4); 
    }
  };

  const handleAction = (actionType) => {
    if (chatStep !== 4 || isLoading) return;

    let extraContext = "";
    let modifiedLevel = requestData.skillLevel;
    let botLoadingText = '';

    switch(actionType) {
        case 'regenerate':
            botLoadingText = 'Regenerating fresh materials...';
            break;
        case 'simplify':
            botLoadingText = 'Simplifying concepts...';
            extraContext = "Explain in very simple terms with analogies.";
            modifiedLevel = "Beginner 🌱";
            break;
        case 'deeper':
            botLoadingText = 'Going deeper...';
            extraContext = "Provide advanced details and edge cases.";
            modifiedLevel = "Advanced 🧠";
            break;
        default: return;
    }

    setMessages(prev => [...prev, { type: 'user', text: actionType.charAt(0).toUpperCase() + actionType.slice(1) }]);
    
    const ai_instruction = getAiInstruction(mode, requestData.subject, requestData.topic, modifiedLevel, extraContext);
    const actionData = { 
        ...requestData, 
        skillLevel: modifiedLevel, 
        materialType: mode === 'material' ? 'study_guide' : 'flashcards', 
        instruction: ai_instruction 
    };

    setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: botLoadingText }]);
        fetchAiContent(actionData);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-5xl mx-auto w-full">
      <h2 className="text-xl font-bold text-black px-2">Study Resources</h2>
      <div className="flex gap-4 px-2">
        <button onClick={() => startChat('material')} disabled={isLoading} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border shadow-sm ${mode === 'material' ? 'bg-[#1ABC9C]/10 border-[#1ABC9C] text-[#1ABC9C]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Book size={24} /> Generate Study Guide
        </button>
        <button onClick={() => startChat('flashcards')} disabled={isLoading} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border shadow-sm ${mode === 'flashcards' ? 'bg-[#1ABC9C]/10 border-[#1ABC9C] text-[#1ABC9C]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Zap size={24} /> Generate Flash Cards
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col relative overflow-hidden shadow-sm">
         <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.text && (
                      <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${msg.type === 'user' ? 'bg-[#1e3a8a] text-white rounded-br-none' : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                          {msg.text}
                      </div>
                    )}
                    {msg.options && (
                        <div className="flex flex-wrap gap-2 mt-3 max-w-[80%]">
                            {msg.options.map((opt) => (
                                <button key={opt} onClick={() => handleSend(opt)} disabled={isLoading || (idx !== messages.length - 1)} className="px-4 py-2 bg-[#1ABC9C]/10 text-[#1ABC9C] border border-[#1ABC9C]/30 rounded-full text-sm font-bold hover:bg-[#1ABC9C]/20 transition-colors disabled:opacity-50">
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                    {msg.data && (
                      <div className="mt-4 grid gap-4 w-full max-w-[95%] grid-cols-1 md:grid-cols-2">
                        {msg.data.map((item, cardIdx) => (
                          <div key={cardIdx} className="bg-white border-2 border-[#1ABC9C]/20 rounded-xl p-5 shadow-sm hover:border-[#1ABC9C] transition-all">
                            <h4 className="font-bold text-[#1e3a8a] border-b border-gray-100 pb-3 mb-3">{item.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-3 text-gray-500"><Loader2 size={18} className="animate-spin" /> Thinking...</div></div>}
            <div ref={messagesEndRef} />
         </div>

         <div className={`flex gap-2 mb-3 overflow-x-auto pb-2 shrink-0 transition-opacity duration-300 ${chatStep === 4 ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
            <button onClick={() => handleAction('regenerate')} disabled={isLoading} className="flex items-center gap-1.5 bg-white border border-[#1ABC9C] text-[#1ABC9C] px-4 py-2 rounded-full text-xs font-bold hover:bg-teal-50 shadow-sm"><RotateCw size={14} /> Regenerate</button>
            <button onClick={() => handleAction('simplify')} disabled={isLoading} className="flex items-center gap-1.5 bg-white border border-[#1ABC9C] text-[#1ABC9C] px-4 py-2 rounded-full text-xs font-bold hover:bg-teal-50 shadow-sm"><Minimize2 size={14} /> Simplify</button>
            <button onClick={() => handleAction('deeper')} disabled={isLoading} className="flex items-center gap-1.5 bg-white border border-[#1ABC9C] text-[#1ABC9C] px-4 py-2 rounded-full text-xs font-bold hover:bg-teal-50 shadow-sm"><Maximize2 size={14} /> Go Deeper</button>
         </div>

         <div className="bg-white p-2 rounded-xl border-2 border-gray-200 flex items-center gap-2 shadow-sm shrink-0 focus-within:border-[#1ABC9C] transition-colors">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
              type="text" 
              placeholder={chatStep === 0 ? "Select a mode above first..." : "Type your response here..."} 
              className="flex-1 outline-none px-3 text-sm text-black disabled:text-gray-400" 
              disabled={chatStep === 0 || chatStep === 4 || isLoading} 
            />
            <button 
              onClick={() => handleSend()} 
              disabled={chatStep === 0 || chatStep === 4 || isLoading} 
              className={`p-3 rounded-lg text-white transition-colors ${chatStep === 0 || chatStep === 4 || isLoading ? 'bg-gray-300' : 'bg-[#1e3a8a] hover:bg-[#172554] shadow-md'}`}
            >
              <Send size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default StudyResources;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { X, Send, Loader2, WifiOff, Wifi } from 'lucide-react';

// --- helpers ---
const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
};

const groupByDate = (messages) => {
  const groups = [];
  let currentDate = null;
  let currentGroup = null;

  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.timestamp);
    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      currentGroup = { label: dateLabel, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return groups;
};

// --- Avatar & Bubbles ---
const Avatar = ({ name, size = 'md' }) => {
  const letter = name ? name.charAt(0).toUpperCase() : '?';
  const hue = [...(name || 'A')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bg = `hsl(${hue}, 55%, 55%)`;
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {letter}
    </div>
  );
};

const MessageBubble = ({ msg, isOwn }) => {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar name={msg.sender} />}
      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && (
          <span className="text-xs font-semibold text-gray-500 ml-1">{msg.sender}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? 'bg-[#1ABC9C] text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
          }`}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-gray-400 mx-1">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
};

const DateDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs font-semibold text-gray-400 whitespace-nowrap px-2">{label}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ✨ CHANGED: Now takes props instead of pulling from the URL
const ChatModal = ({ groupId, groupName, onClose }) => {
  const currentUser = localStorage.getItem('userName') || 'Anonymous';
  const token = localStorage.getItem('token');

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const stompClientRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:8082/api/chat/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [groupId, token]);

  // WebSocket Connection (Auto-disconnects when modal closes!)
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8082/chat'),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/group/${groupId}`, (frame) => {
          const incomingMsg = JSON.parse(frame.body);
          setMessages((prev) => [...prev, incomingMsg]);
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => setIsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    // Cleanup when modal closes
    return () => {
      client.deactivate();
    };
  }, [groupId]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || !isConnected || !stompClientRef.current) return;

    const payload = {
      sender: currentUser,
      content: trimmed,
      groupId: Number(groupId),
    };

    stompClientRef.current.publish({
      destination: `/app/chat/${groupId}`,
      body: JSON.stringify(payload),
    });

    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, isConnected, currentUser, groupId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupByDate(messages);

  return (
    // ✨ CHANGED: The dark overlay and modal container
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-50 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-[#1e3a8a] text-white shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
            {groupName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-bold truncate text-lg leading-tight">{groupName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></div>
              <p className="text-xs text-blue-200">{isConnected ? 'Live Chat' : 'Connecting...'}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8fafc]">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin text-[#1ABC9C]" />
              <span className="text-sm font-medium">Loading messages…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 select-none">
              <div className="w-16 h-16 rounded-full bg-[#1ABC9C]/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1ABC9C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400">Be the first to say hello! 👋</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <DateDivider label={group.label} />
                <div className="space-y-3">
                  {group.messages.map((msg, idx) => (
                    <MessageBubble
                      key={msg.id ?? `${group.label}-${idx}`}
                      msg={msg}
                      isOwn={msg.sender === currentUser}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="px-5 py-4 bg-white border-t border-gray-200 shrink-0">
          {!isConnected && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
              <WifiOff size={13} />
              <span>Reconnecting to chat server…</span>
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-2.5 focus-within:border-[#1ABC9C] focus-within:bg-white transition-colors shadow-sm">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? 'Type a message… (Enter to send)' : 'Connecting…'}
                disabled={!isConnected}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed leading-5 max-h-24 overflow-y-auto"
                style={{ height: '20px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
              className="w-11 h-11 rounded-full bg-[#1ABC9C] hover:bg-[#16a085] disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-md"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatModal;
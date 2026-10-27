import React, { useEffect, useState, useRef } from 'react';
import { Send, Sparkles, MessageSquare, Plus, Globe, HelpCircle, Loader2, Info, BookOpen } from 'lucide-react';
import FormattedMarkdown from '../components/FormattedMarkdown';
import { useLanguage } from '../context/LanguageContext';
import { localizeSchemeName, localizeTerm } from '../utils/localizationHelper';

interface AiAssistantProps {
  token: string;
  apiUrl: string;
}

export default function AiAssistant({ token, apiUrl }: AiAssistantProps) {
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [schemesList, setSchemesList] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      setSidebarLoading(true);
      const res = await fetch(`${apiUrl}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        handleSelectSession(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSidebarLoading(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/schemes/public`);
      const data = await res.json();
      setSchemesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSchemes();
  }, [token, apiUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = async (session: any) => {
    setActiveSession(session);
    setSelectedSchemeId(session.schemeId ? String(session.schemeId) : '');
    try {
      const res = await fetch(`${apiUrl}/api/chat/messages/${session.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const titleStr = selectedSchemeId 
          ? `Chat: ${schemesList.find(s => String(s.id) === selectedSchemeId)?.name}`
          : "General Welfare Q&A";
          
      const res = await fetch(`${apiUrl}/api/chat/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schemeId: selectedSchemeId ? parseInt(selectedSchemeId) : null,
          title: titleStr
        })
      });
      
      const newSession = await res.json();
      setSessions(prev => [newSession, ...prev]);
      handleSelectSession(newSession);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || !activeSession) return;

    if (!textToSend) setInputValue('');
    setChatLoading(true);

    const tempUserMsg = { id: Date.now(), role: 'user', message: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${apiUrl}/api/chat/send/${activeSession.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });
      
      const reply = await res.json();
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, reply]);
    } catch (err) {
      console.error(err);
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        message: "Failed to establish secure RAG connection. Please verify the ml-service is active.",
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const presets = language === 'hi' ? [
    t('ai.suggested.q1', 'मैं किन सरकारी योजनाओं के लिए पात्र हूँ?'),
    t('ai.suggested.q2', 'पीएम-किसान योजना के लिए कौन से दस्तावेज चाहिए?'),
    t('ai.suggested.q3', 'कॉलेज छात्रों के लिए कौन सी छात्रवृत्तियां हैं?'),
    t('ai.suggested.q4', 'दिव्यांग पेंशन योजना के क्या नियम हैं?')
  ] : language === 'ta' ? [
    t('ai.suggested.q1', 'நான் எந்தெந்த அரசு நலத்திட்டங்களுக்கு தகுதியானவன்?'),
    t('ai.suggested.q2', 'பிஎம்-கிசான் திட்டத்திற்கு என்னென்ன ஆவணங்கள் தேவை?'),
    t('ai.suggested.q3', 'கல்லூரி மாணவர்களுக்கான உதவித்தொகைகள் யாவை?'),
    t('ai.suggested.q4', 'மாற்றுத்திறனாளி ஓய்வூதியத் திட்டம் பற்றி விளக்குக.')
  ] : [
    t('ai.suggested.q1', 'What government schemes am I eligible for?'),
    t('ai.suggested.q2', 'What are the required documents for PM-KISAN?'),
    t('ai.suggested.q3', 'Are there educational scholarships for college students?'),
    t('ai.suggested.q4', 'Explain how disability welfare pension works.')
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white overflow-hidden text-left animate-fadeIn">
      
      {/* Session sidebar */}
      <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-extrabold text-gov-blue-900 font-display text-xs uppercase tracking-wide">{localizeTerm("Discussion channels", language)}</h3>
            <button
              onClick={handleCreateSession}
              className="p-1.5 text-gov-blue-500 hover:bg-gov-blue-100 rounded-xl transition-all cursor-pointer"
              title={localizeTerm("Create new session", language)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Context Picker */}
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide">{localizeTerm("Active Context Scheme", language)}</label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs outline-none bg-slate-50 focus:bg-white font-semibold cursor-pointer"
            >
              <option value="">{localizeTerm("General Discovery (No context)", language)}</option>
              {schemesList.map(s => <option key={s.id} value={s.id}>{localizeSchemeName(s.name, language)}</option>)}
            </select>
          </div>

          {/* Sessions List */}
          {sidebarLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-gov-blue-500" />
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((s) => {
                const isActive = activeSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`w-full p-3 rounded-xl text-xs text-left font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-gov-blue-500 border-gov-blue-500 text-white font-extrabold shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gov-blue-500'}`} />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col justify-between bg-white relative">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gov-blue-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-gov-blue-900 font-display">{t('ai.title', 'AI Scheme Assistant')}</h2>
              <span className="text-[9px] text-slate-400 block mt-0.5 uppercase font-bold">
                {activeSession ? `${localizeTerm('Context Channel:', language)} ${activeSession.title}` : localizeTerm('Select or create a conversation channel', language)}
              </span>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
            <Globe className="w-3 h-3" /> {localizeTerm("Grounded RAG Active", language)}
          </div>
        </div>

        {/* Messaging thread panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20">
          {!activeSession ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
              <MessageSquare className="w-10 h-10 text-gov-blue-300" />
              <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">{localizeTerm("Select Conversation Channel", language)}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {localizeTerm("Select Conversation Channel desc", language)}
              </p>
              <button
                onClick={handleCreateSession}
                className="px-4 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {localizeTerm("Start New Session", language)}
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <Sparkles className="w-8 h-8 text-gov-gold-500 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">{localizeTerm("Grounded Q&A Platform", language)}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {localizeTerm("Grounded Q&A desc", language)}
                </p>
              </div>

              {/* Suggestions chips */}
              <div className="grid grid-cols-1 gap-2 w-full">
                {presets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    className="p-3 border border-slate-200 hover:border-gov-blue-500 hover:bg-gov-blue-50 rounded-xl text-left text-xs font-bold text-slate-600 hover:text-gov-blue-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <HelpCircle className="w-4 h-4 text-gov-blue-500 flex-shrink-0" />
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="space-y-1 max-w-3xl w-full">
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                        isUser 
                          ? 'bg-gov-blue-500 border-gov-blue-600 text-white rounded-br-none shadow-sm ml-auto max-w-xl' 
                          : 'bg-white border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                      }`}>
                        {isUser ? m.message : <FormattedMarkdown content={m.message} />}
                      </div>

                      {/* Source details for assistant */}
                      {!isUser && (
                        <div className="px-1 text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                          <BookOpen className="w-3 h-3 text-slate-300" />
                          <span>{localizeTerm("Sources used: Government Scheme Guidelines Vector Index", language)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gov-blue-500" />
                    <span className="text-xs text-slate-400 font-semibold">{localizeTerm("AI is analyzing database guidelines...", language)}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Controls */}
        {activeSession && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex gap-2">
            <input
              type="text"
              placeholder={localizeTerm("Ask about required documents...", language)}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !chatLoading) handleSendMessage();
              }}
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all shadow-sm"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !inputValue.trim()}
              className="px-4 py-3 bg-gov-blue-500 hover:bg-gov-blue-600 disabled:bg-gov-blue-200 text-white rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


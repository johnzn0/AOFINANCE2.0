import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, X, Send, Bot, User, Lightbulb } from 'lucide-react';
import { AppState, UserProfile } from '../types';
import { executeAITool } from '../lib/aiTools';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  userProfile?: UserProfile | null;
  autoSpeakFirstTime?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isFunctionCall?: boolean;
}

interface AIContent {
  role: 'user' | 'model';
  parts: any[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  state,
  userProfile,
  autoSpeakFirstTime = true,
}) => {
  const userName = userProfile?.displayName || state.settings.profileName || 'Usuário';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Store the raw history for the Gemini API
  const [history, setHistory] = useState<AIContent[]>([]);
  
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSpokenWelcomeRef = useRef(false);

  const quickQuestions = [
    'Qual é o meu saldo atual?',
    'Com o que gastei mais esse mês?',
    'Como estou nas minhas metas?',
    'Crie um orçamento para mim',
    'O que é inflação?',
    'Resuma minhas finanças',
  ];

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !voiceEnabled) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.includes('pt'));
    if (ptVoice) utterance.voice = ptVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const welcomeKey = `aofinance_welcomed_${userProfile?.uid || 'anon'}`;
    const alreadyWelcomed = localStorage.getItem(welcomeKey);
    const initialGreeting = `Olá, ${userName}! Sou seu Assistente de Inteligência Artificial. Posso analisar suas finanças, responder dúvidas sobre investimentos ou conversar sobre qualquer assunto. Como posso ajudar?`;
    
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        sender: 'bot',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      // Initialize history for API
      setHistory([{ role: 'model', parts: [{ text: initialGreeting }] }]);
    }

    if (!alreadyWelcomed && autoSpeakFirstTime && !hasSpokenWelcomeRef.current) {
      hasSpokenWelcomeRef.current = true;
      localStorage.setItem(welcomeKey, 'true');
      setTimeout(() => speakText(initialGreeting), 400);
    }
    return () => stopSpeaking();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptToSend?: string) => {
    const prompt = (promptToSend || inputMsg).trim();
    if (!prompt) return;
    stopSpeaking();

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    const newHistoryPart: AIContent = { role: 'user', parts: [{ text: prompt }] };

    setMessages((prev) => [...prev, newMsg]);
    setHistory((prev) => [...prev, newHistoryPart]);
    if (!promptToSend) setInputMsg('');
    
    setLoading(true);

    try {
      await processTurn([...history, newHistoryPart]);
    } catch (err) {
      console.error(err);
      addBotMessage('Desculpe, tive um problema de conexão. Poderia repetir?');
      setLoading(false);
    }
  };

  const addBotMessage = (text: string) => {
    setMessages((prev) => [...prev, {
      id: String(Date.now()),
      sender: 'bot',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    if (voiceEnabled) speakText(text);
  };

  const processTurn = async (currentHistory: AIContent[]) => {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: currentHistory }),
    });
    
    const data = await res.json();

    if (data.functionCalls) {
      // The model wants to call tools
      let updatedHistory = [...currentHistory];
      const modelCallPart: AIContent = { role: 'model', parts: [] };
      const responsePart: AIContent = { role: 'user', parts: [] }; // The response is sent as role 'user'

      for (const call of data.functionCalls) {
        modelCallPart.parts.push({ functionCall: call });
        
        // Execute tool securely locally
        const result = executeAITool(call.name, call.args, state);
        
        responsePart.parts.push({
          functionResponse: {
            name: call.name,
            response: result
          }
        });
      }

      updatedHistory.push(modelCallPart);
      updatedHistory.push(responsePart);
      
      // Update our history state and recursive call to get final text
      setHistory(updatedHistory);
      await processTurn(updatedHistory);
      return;
    }

    if (data.reply) {
      addBotMessage(data.reply);
      setHistory((prev) => [...prev, { role: 'model', parts: [{ text: data.reply }] }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 w-full max-w-2xl h-[85vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg relative">
              <Sparkles className="w-5 h-5 text-white" />
              {isSpeaking && <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span></span>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-white text-base">Assistente IA</h3>
              </div>
              <p className="text-xs text-slate-400">{isSpeaking ? 'Falando com você...' : 'Conectado aos seus dados'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                else if (messages.length > 0) {
                  const lastBot = [...messages].reverse().find((m) => m.sender === 'bot');
                  if (lastBot) speakText(lastBot.text);
                }
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${voiceEnabled ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-800/80 border-slate-700 text-slate-400'}`}
              title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
            >
              {voiceEnabled ? <><Volume2 className="w-4 h-4" /><span className="hidden sm:inline">Voz On</span></> : <><VolumeX className="w-4 h-4" /><span className="hidden sm:inline">Voz Off</span></>}
            </button>
            <button onClick={() => { stopSpeaking(); onClose(); }} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-slate-950/50">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl p-4 leading-relaxed shadow-sm space-y-2 ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none markdown-body'}`}>
                {m.sender === 'bot' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] text-slate-400/80">
                  <span>{m.timestamp}</span>
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300"></span>
                <span className="ml-1">Pensando e analisando dados...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Suggestions */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button key={idx} onClick={() => handleSendMessage(q)} disabled={loading} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 whitespace-nowrap transition shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" /><span>{q}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <input
              type="text"
              placeholder="Pergunte sobre suas finanças ou qualquer outro assunto..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={loading || !inputMsg.trim()} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition flex items-center gap-1.5">
              <Send className="w-4 h-4" /><span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

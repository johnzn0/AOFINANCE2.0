import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Send,
  Bot,
  User,
  Play,
  Pause,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { AppState, UserProfile } from '../types';

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
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSpokenWelcomeRef = useRef(false);

  // Calculated totals for summary context
  const income = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const totalBalanceInBank = state.transactions.reduce(
    (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
  const investedTotalCurrent = state.investments.reduce((s, i) => s + i.current, 0);
  const netWorth = totalBalanceInBank + investedTotalCurrent;

  const userSummary = {
    name: userName,
    income,
    expense,
    netWorth,
    goalsCount: state.goals.length,
  };

  // Function to speak text using browser speech synthesis
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !voiceEnabled) return;

    window.speechSynthesis.cancel(); // stop previous

    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding a Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(
      (v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.includes('pt')
    );
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

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

  // Initial welcome message
  useEffect(() => {
    if (!isOpen) return;

    const welcomeKey = `aofinance_welcomed_${userProfile?.uid || 'guest'}`;
    const alreadyWelcomed = localStorage.getItem(welcomeKey);

    const initialGreeting = `Olá, ${userName}! Seja muito bem-vindo ao AOFINANCE. Eu sou o seu assistente financeiro pessoal. Estou aqui para te ajudar a organizar suas contas, bater suas metas e fazer seu dinheiro render mais. Como posso te orientar hoje?`;

    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }

    // Speak welcome message if first time open or autoSpeakFirstTime
    if (!alreadyWelcomed && autoSpeakFirstTime && !hasSpokenWelcomeRef.current) {
      hasSpokenWelcomeRef.current = true;
      localStorage.setItem(welcomeKey, 'true');

      // Speech synthesis voice delay for smooth playback after modal open
      setTimeout(() => {
        speakText(initialGreeting);
      }, 400);
    }

    return () => {
      stopSpeaking();
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptToSend?: string) => {
    const prompt = (promptToSend || inputMsg).trim();
    if (!prompt) return;

    stopSpeaking();

    const userMsgObj: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    if (!promptToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userSummary,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || 'Estou à disposição para responder suas dúvidas sobre orçamento e investimentos!';

      const botMsgObj: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsgObj]);
      if (voiceEnabled) {
        speakText(botReply);
      }
    } catch (err) {
      const errorMsgObj: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: 'Não consegui me conectar no momento, mas posso te orientar: mantenha suas receitas sempre superiores às suas despesas!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsgObj]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Qual é o meu resumo financeiro este mês?',
    'Como posso economizar mais dinheiro?',
    'Como criar uma reserva de emergência?',
    'Dicas para organizar meus investimentos',
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[680px] flex flex-col shadow-2xl overflow-hidden relative text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-white text-base">Assistente IA AOFINANCE</h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30 rounded-full">
                  Voz Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isSpeaking ? 'Falando com você...' : 'Consultor de Finanças Pessoais'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else if (messages.length > 0) {
                  const lastBot = [...messages].reverse().find((m) => m.sender === 'bot');
                  if (lastBot) speakText(lastBot.text);
                }
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                voiceEnabled
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
            >
              {voiceEnabled ? (
                <>
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-emerald-400' : ''}`} />
                  <span className="hidden sm:inline">{isSpeaking ? 'Falando...' : 'Voz On'}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline">Voz Off</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Visualizer Indicator */}
        {isSpeaking && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="flex gap-1 items-end h-4">
                <span className="w-1 bg-emerald-400 animate-[bounce_0.6s_infinite_100ms] h-2"></span>
                <span className="w-1 bg-emerald-400 animate-[bounce_0.6s_infinite_300ms] h-4"></span>
                <span className="w-1 bg-emerald-400 animate-[bounce_0.6s_infinite_200ms] h-3"></span>
                <span className="w-1 bg-emerald-400 animate-[bounce_0.6s_infinite_400ms] h-2"></span>
              </span>
              <span className="font-medium">Assistente falando por voz...</span>
            </div>
            <button
              onClick={stopSpeaking}
              className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded text-[10px] font-bold"
            >
              Pausar Voz
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 leading-relaxed shadow-sm space-y-1 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[10px] text-slate-400">
                  <span>{m.timestamp}</span>
                  {m.sender === 'bot' && (
                    <button
                      onClick={() => speakText(m.text)}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                      title="Ouvir mensagem"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Ouvir</span>
                    </button>
                  )}
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
              <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300"></span>
                <span className="ml-1">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Suggestions */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-full text-slate-300 whitespace-nowrap transition shrink-0 flex items-center gap-1"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Digite sua dúvida financeira ou peça uma análise..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

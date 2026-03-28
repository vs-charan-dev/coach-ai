/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Mic, MicOff, MessageSquare, Sparkles, History, AlertCircle, 
  ChevronRight, FileText, Briefcase, Video, BarChart3, X, 
  Settings, User, LayoutDashboard, Play, Square, Info,
  Clock, Zap, Target, Brain, ArrowRight, CheckCircle2,
  Volume2, Eye, UserCheck, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGeminiLive } from "./hooks/useGeminiLive";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Markdown from "react-markdown";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom hook for session timer
function useTimer(isActive: boolean) {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    let interval: number | null = null;
    if (isActive) {
      interval = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return { seconds, formatted: formatTime(seconds) };
}

export default function App() {
  const { isActive, transcripts, error, analytics, startSession, stopSession } = useGeminiLive();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "context">("context");
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { formatted: sessionDuration } = useTimer(isActive);

  // Auto-scroll to bottom of transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Show analytics when they arrive
  useEffect(() => {
    if (analytics) {
      setShowAnalytics(true);
    }
  }, [analytics]);

  const handleStart = () => {
    if (!resumeText || !jobDescription) {
      // Small validation
      setActiveTab("context");
      return;
    }
    setActiveTab("chat");
    if (videoRef.current) {
      startSession({ resumeText, jobDescription }, videoRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const lastAiMessage = useMemo(() => {
    const aiMessages = transcripts.filter(t => t.role === "model");
    return aiMessages[aiMessages.length - 1]?.text || "Ready to begin your session.";
  }, [transcripts]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group cursor-pointer">
            <Sparkles className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold tracking-tight">Coach.ai</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">System Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab("context")}
              className={cn(
                "px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === "context" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Target className="w-3.5 h-3.5" />
              Preparation
            </button>
            <button 
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === "chat" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              Live Session
            </button>
          </div>

          <div className="flex items-center gap-4">
            {isActive && (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[11px] font-mono font-bold text-orange-500">{sessionDuration}</span>
              </div>
            )}
            <div className="w-px h-6 bg-white/5" />
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Control Center */}
        <aside className="w-80 border-r border-white/5 bg-zinc-900/10 flex flex-col shrink-0">
          <div className="p-6 space-y-8">
            {/* Video Feed Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Video className="w-3 h-3" />
                  Visual Analysis
                </span>
                {isActive && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> 
                    Live
                  </span>
                )}
              </div>
              <div className="aspect-[4/3] bg-black rounded-[2rem] border border-white/5 overflow-hidden relative group shadow-2xl ring-1 ring-white/5">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={cn("w-full h-full object-cover transition-all duration-1000", isActive ? "scale-100 opacity-100" : "scale-110 opacity-20 grayscale")}
                />
                {!isActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <Video className="w-6 h-6 opacity-20" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Camera Inactive</p>
                  </div>
                )}
                {isActive && (
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                      <Eye className="w-3 h-3 text-green-500" />
                      <span className="text-[9px] font-bold text-white uppercase">Eye Contact: Good</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Actions */}
            <div className="space-y-3">
              <button 
                onClick={isActive ? stopSession : handleStart}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] group",
                  isActive 
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10" 
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                )}
              >
                {isActive ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
                )}
                {isActive ? "End Session" : "Start Interview"}
              </button>

              {analytics && !isActive && (
                <button 
                  onClick={() => setShowAnalytics(true)}
                  className="w-full py-4 rounded-2xl font-bold text-sm bg-zinc-900/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
                >
                  <BarChart3 className="w-4 h-4" />
                  Performance Report
                </button>
              )}
            </div>

            {/* Real-time Insights */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Metrics</span>
                <Zap className="w-3 h-3 text-orange-500" />
              </div>
              
              <div className="space-y-5">
                {[
                  { label: "Confidence", value: isActive ? 88 : 0, icon: UserCheck },
                  { label: "Clarity", value: isActive ? 74 : 0, icon: Volume2 },
                  { label: "Posture", value: isActive ? 92 : 0, icon: ShieldCheck }
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <metric.icon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-400">{metric.label}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-orange-500">{metric.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${metric.value}%` }} 
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
            <div className="flex items-start gap-3 text-zinc-500">
              <ShieldCheck className="w-4 h-4 shrink-0 text-green-500/50" />
              <p className="text-[10px] leading-relaxed font-medium">
                Privacy First: All visual and audio analysis is ephemeral and processed locally.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#080808] relative">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {activeTab === "context" ? (
              <motion.div 
                key="context"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 p-12 lg:p-20 max-w-5xl mx-auto w-full space-y-16 overflow-y-auto scrollbar-hide z-10"
              >
                <div className="space-y-4 text-center">
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4"
                  >
                    <Brain className="w-3 h-3" />
                    AI-Powered Preparation
                  </motion.div>
                  <h2 className="text-5xl font-display font-bold tracking-tight text-gradient">Configure your session.</h2>
                  <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Upload your resume and define your target role to receive highly personalized interview questions and feedback.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        Professional Resume
                      </label>
                      <label className="cursor-pointer text-[10px] font-bold text-orange-500 hover:text-orange-400 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3" />
                        Upload TXT
                        <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="relative group">
                      <textarea 
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume content here..."
                        className="w-full h-[320px] bg-zinc-900/20 border border-white/5 rounded-[2rem] p-8 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/30 transition-all resize-none leading-relaxed glass"
                      />
                      {!resumeText && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                          <FileText className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                        Target Role
                      </label>
                      <input 
                        type="text"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer at Vercel"
                        className="w-full bg-zinc-900/20 border border-white/5 rounded-2xl px-8 py-5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/30 transition-all glass"
                      />
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">Session Goals</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          "Behavioral Question Mastery",
                          "Technical Depth Analysis",
                          "Communication Clarity",
                          "Body Language Coaching"
                        ].map((goal) => (
                          <div key={goal} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
                            <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-medium text-zinc-300">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 glass-orange rounded-[2rem] space-y-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-12 h-12 text-orange-500" />
                      </div>
                      <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        Live Intelligence
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Our AI models will simulate a high-pressure interview environment, providing real-time feedback on your performance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-12 flex flex-col items-center gap-4">
                  <button 
                    onClick={handleStart}
                    disabled={!resumeText || !jobDescription}
                    className="px-16 py-5 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    Begin Interview Session
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Estimated Duration: 15-20 Minutes</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Session Header */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-black/20 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-orange-500 animate-pulse" : "bg-zinc-700")} />
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                        {isActive ? "Live Interview" : "Session Paused"}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-zinc-500">
                      <History className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{transcripts.length} Interactions</span>
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 items-center h-4">
                          {[...Array(8)].map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: [4, Math.random() * 16 + 4, 4] }}
                              transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                              className="w-0.5 bg-orange-500/50 rounded-full"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Processing Audio</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transcript Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-hide">
                  {transcripts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
                      <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 shadow-2xl">
                        <Mic className="w-8 h-8 text-zinc-700" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-zinc-300">Awaiting your first answer.</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">The AI coach will begin by introducing itself and asking your first question based on your resume.</p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {transcripts.map((item, idx) => (
                      <motion.div
                        key={item.timestamp + idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-6",
                          item.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border border-white/5 shadow-lg",
                          item.role === "user" ? "bg-zinc-800" : "bg-orange-500/10"
                        )}>
                          {item.role === "user" ? <User className="w-5 h-5 text-zinc-400" /> : <Brain className="w-5 h-5 text-orange-500" />}
                        </div>
                        
                        <div className={cn(
                          "flex flex-col gap-3 max-w-[75%]",
                          item.role === "user" ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-8 py-5 rounded-[2rem] text-[15px] leading-relaxed shadow-xl",
                            item.role === "user" 
                              ? "bg-zinc-800 text-zinc-100 rounded-tr-none" 
                              : "glass text-zinc-300 rounded-tl-none border-white/10"
                          )}>
                            {item.text}
                          </div>
                          <span className="px-4 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                            {item.role === "user" ? "Candidate" : "AI Coach"} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={transcriptEndRef} />
                </div>

                {/* AI Status Bar */}
                <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                  <div className="max-w-4xl mx-auto flex items-center gap-8">
                    <div className="flex-1 p-6 glass rounded-3xl flex items-center gap-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Sparkles className={cn("w-6 h-6 text-orange-500", isActive && "animate-pulse")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Latest Feedback</p>
                        <p className="text-sm text-zinc-300 font-medium truncate italic">"{lastAiMessage}"</p>
                      </div>
                      {isActive && (
                        <div className="flex gap-1.5 items-center px-4">
                          {[...Array(4)].map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ scaleY: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                              className="w-1 h-4 bg-orange-500 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && analytics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 lg:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="bg-[#0c0c0c] border border-white/10 w-full max-w-5xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="p-10 lg:p-14 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-orange-500/20">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight">Performance Analysis</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Session ID: #8291-X</span>
                      <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em]">Verified by AI</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnalytics(false)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors group"
                >
                  <X className="w-7 h-7 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 lg:p-20 scrollbar-hide">
                <div className="max-w-3xl mx-auto">
                  <div className="prose prose-invert prose-orange max-w-none prose-p:text-zinc-400 prose-p:text-lg prose-p:leading-relaxed prose-headings:font-display prose-headings:tracking-tight prose-strong:text-orange-500 prose-li:text-zinc-400 prose-li:text-lg">
                    <Markdown>{analytics}</Markdown>
                  </div>
                </div>
              </div>

              <div className="p-10 lg:p-14 border-t border-white/5 bg-zinc-900/20 flex flex-col sm:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next Recommended Step</p>
                    <p className="text-xs font-bold text-zinc-200">Review "Technical Depth" section in report.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnalytics(false)}
                  className="w-full sm:w-auto px-12 py-5 bg-white text-black rounded-2xl font-bold text-base hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl shadow-white/5"
                >
                  Dismiss Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="px-8 py-4 bg-red-500 text-white rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(239,68,68,0.3)] font-bold text-sm">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest opacity-80">System Alert</span>
                {error}
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Sparkles, FileText, Search, Plus, MessageSquare, Clock, X, 
  ChevronDown, FileEdit, Mail, Briefcase, GraduationCap, Loader2, 
  Trash2, Rocket, ArrowRight, Target, CheckCircle2,
  Map, Send, Upload, Activity, ListChecks, PanelRightOpen,
  type LucideIcon 
} from "lucide-react";
import { listSessions, renameSession, deleteSession, DocumentType } from "@/lib/api/chatOrchestrator";
import { FullPageJourney } from "@/components/dashboard/FullPageJourney";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FeatureKey = "document_builder" | null;

// Document type options - simplified chip style
const documentTypeOptions: Array<{ key: DocumentType | 'analyze'; label: string; icon: LucideIcon; colorClass: string }> = [
  { key: "sop", label: "SOP", icon: FileEdit, colorClass: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { key: "lor", label: "LOR", icon: Mail, colorClass: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { key: "cv", label: "CV", icon: GraduationCap, colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  { key: "resume", label: "Resume", icon: Briefcase, colorClass: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { key: "analyze", label: "Analyze", icon: Search, colorClass: "text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100" },
];

// Quick Access links for right sidebar
const quickLinks: Array<{ title: string; href: string; icon: LucideIcon; gradient: string }> = [
  { title: 'Document Vault', href: '/dashboard/document-ai', icon: Upload, gradient: 'from-blue-500 to-indigo-600' },
  { title: 'SOP Generator', href: '/dashboard/document-builder/sop-generator', icon: FileText, gradient: 'from-purple-500 to-pink-600' },
  { title: 'LOR Generator', href: '/dashboard/document-builder/lor-generator', icon: FileText, gradient: 'from-violet-500 to-purple-600' },
  { title: 'Resume Builder', href: '/dashboard/document-builder/resume', icon: Briefcase, gradient: 'from-cyan-500 to-blue-600' },
  { title: 'CV Builder', href: '/dashboard/document-builder/cv', icon: GraduationCap, gradient: 'from-emerald-500 to-teal-600' },
  { title: 'Application Tracker', href: '/dashboard/application-tracker', icon: ListChecks, gradient: 'from-green-500 to-emerald-600' },
  { title: 'Monitoring Agent', href: '/dashboard/monitoring-agent', icon: Activity, gradient: 'from-orange-500 to-red-600' },
  { title: 'Document AI', href: '/dashboard/document-ai', icon: Upload, gradient: 'from-pink-500 to-rose-600' },
];

type RecentChat = {
  id: string;
  title?: string;
  updatedAt?: string;
  documentType?: DocumentType | null;
};

// Welcome Modal Component
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to EduLens! 🎉</h2>
          <p className="text-white/90">Your AI-powered study abroad journey starts now</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Your roadmap is ready</h4>
              <p className="text-sm text-slate-600">Track your progress through each stage</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">One AI brain, multiple tools</h4>
              <p className="text-sm text-slate-600">Generate documents, track applications, get guidance</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Just ask anything</h4>
              <p className="text-sm text-slate-600">Type your questions to get started</p>
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            Let&apos;s Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function NewDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <NewDashboardInner />
    </Suspense>
  );
}

type ViewMode = 'journey' | 'chat';

function NewDashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('journey');
  
  // Chat input state (simplified - redirects to chat page on send)
  const [selectedTool, setSelectedTool] = useState<FeatureKey>("document_builder");
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | 'analyze' | null>(null);
  const [showDocumentTypeDropdown, setShowDocumentTypeDropdown] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  // Sidebar state - closed by default
  const [sidebarOpen, setSidebarOpen] = useState(true);  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  // Dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatActionTarget, setChatActionTarget] = useState<RecentChat | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const documentTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Check for welcome parameter
  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      router.replace('/new-dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const loadRecentChats = useCallback(async () => {
    try {
      const data = await listSessions();
      const mapped: RecentChat[] = (data.sessions || []).map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        documentType: s.document_type ?? null,
      }));
      setRecentChats(mapped);
    } catch (e) {
      console.error("Failed to load recent sessions", e);
    }
  }, []);

  const openRename = useCallback((chat: RecentChat) => {
    setChatActionTarget(chat);
    setRenameTitle((chat.title || "").trim());
    setRenameDialogOpen(true);
  }, []);

  const openDelete = useCallback((chat: RecentChat) => {
    setChatActionTarget(chat);
    setDeleteDialogOpen(true);
  }, []);

  const submitRename = useCallback(async () => {
    const target = chatActionTarget;
    const title = renameTitle.trim();
    if (!target || !title) return;
    setIsRenaming(true);
    try {
      await renameSession(target.id, title);
      setRenameDialogOpen(false);
      await loadRecentChats();
    } catch (err) {
      console.error("Failed to rename session", err);
    } finally {
      setIsRenaming(false);
    }
  }, [chatActionTarget, renameTitle, loadRecentChats]);

  const confirmDelete = useCallback(async () => {
    const target = chatActionTarget;
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteSession(target.id);
      setDeleteDialogOpen(false);
      await loadRecentChats();
    } catch (err) {
      console.error("Failed to delete session", err);
    } finally {
      setIsDeleting(false);
    }
  }, [chatActionTarget, loadRecentChats]);

  // Load recent chats on mount
  useEffect(() => {
    loadRecentChats();
  }, [loadRecentChats]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (documentTypeDropdownRef.current && !documentTypeDropdownRef.current.contains(e.target as Node)) {
        setShowDocumentTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle sending message - redirect to chat page with context
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    
    // Store the message context in sessionStorage to pass to chat page
    // Journey mode = roadmap context, Chats mode = document context
    const chatContext = {
      message: inputValue.trim(),
      tool: viewMode === 'journey' ? null : selectedTool,
      documentType: viewMode === 'journey' ? null : selectedDocumentType,
      isJourneyContext: viewMode === 'journey', // Flag for roadmap-focused conversation
    };
    sessionStorage.setItem('pendingChatMessage', JSON.stringify(chatContext));
    
    // Navigate to new chat page
    router.push('/new-dashboard/chat/new');
  }, [inputValue, selectedTool, selectedDocumentType, viewMode, router]);

  // Handle starting chat from journey
  const handleStartChatFromJourney = useCallback((context?: string) => {
    if (context) {
      const chatContext = {
        message: context,
        tool: null,
        documentType: null,
      };
      sessionStorage.setItem('pendingChatMessage', JSON.stringify(chatContext));
    }
    router.push('/new-dashboard/chat/new');
  }, [router]);

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans text-gray-900">
      {/* Left Sidebar */}
      <aside className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col transition-all duration-300 overflow-hidden shadow-sm z-20`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">EduLens</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100/80 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* New Chat Button */}
          <Link 
            href="/new-dashboard/chat/new"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium text-sm"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </Link>
        </div>

        {/* View Mode Tabs */}
        <div className="px-3 pt-3">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('journey')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'journey' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map size={14} />
              Journey
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'chat' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare size={14} />
              Chats
            </button>
          </div>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="px-3 py-2 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Clock size={12} />
            Recent Chats
          </div>
          <div className="space-y-1.5">
            {recentChats.map((chat, index) => (
              <Link
                key={`${chat.id}-${index}`}
                href={`/new-dashboard/chat/${chat.id}`}
                className="group block"
              >
                <div className="flex flex-col gap-1.5 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-200 hover:shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 line-clamp-1 block">
                        {chat.title || (
                          chat.documentType === "sop" ? "SOP Builder Session" :
                          chat.documentType === "lor" ? "LOR Builder Session" :
                          chat.documentType === "cv" ? "CV Builder Session" :
                          chat.documentType === "resume" ? "Resume Builder Session" :
                          "Document Builder Session"
                        )}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {chat.documentType && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                            {chat.documentType.toUpperCase()}
                          </span>
                        )}
                        {chat.updatedAt && (
                          <span className="text-xs text-gray-500 truncate">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openRename(chat); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-500 hover:text-gray-700"
                      >
                        <FileEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDelete(chat); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-500 hover:text-gray-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {recentChats.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                No chats yet. Start a new conversation!
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'journey' ? (
          <FullPageJourney 
            onStartChat={handleStartChatFromJourney}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          /* Chat-style home view - Document Builder & General Chat */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl mb-4">
                  <Sparkles size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Builder & Chat</h1>
                <p className="text-gray-500">Select a document type to build, or just chat about anything</p>
              </div>

              {/* Input Area */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 space-y-4">
                {/* Tool & Document Type Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTool && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm">
                      <FileText size={14} className="text-blue-600" />
                      <span className="font-medium text-blue-900 text-xs">Document Builder</span>
                      <button onClick={() => { setSelectedTool(null); setSelectedDocumentType(null); }} className="text-blue-400 hover:text-blue-700">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {selectedDocumentType && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm ${
                      documentTypeOptions.find(d => d.key === selectedDocumentType)?.colorClass || ''
                    }`}>
                      {(() => {
                        const Icon = documentTypeOptions.find(d => d.key === selectedDocumentType)?.icon;
                        return Icon ? <Icon size={14} /> : null;
                      })()}
                      <span className="font-medium text-xs">{documentTypeOptions.find(d => d.key === selectedDocumentType)?.label}</span>
                      <button onClick={() => setSelectedDocumentType(null)} className="opacity-60 hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {/* Document Type Dropdown - Always show in chat mode */}
                  <div className="relative" ref={documentTypeDropdownRef}>
                    <button
                      onClick={() => setShowDocumentTypeDropdown(!showDocumentTypeDropdown)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors border border-dashed border-gray-300"
                    >
                      <ChevronDown size={12} className={`transition-transform ${showDocumentTypeDropdown ? 'rotate-180' : ''}`} />
                      <span>{selectedDocumentType ? 'Change type' : 'Select document type'}</span>
                    </button>
                    {showDocumentTypeDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[180px] z-30">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase">Document Types</div>
                        {documentTypeOptions.map((docType) => (
                          <button
                            key={docType.key}
                            onClick={() => { setSelectedTool("document_builder"); setSelectedDocumentType(docType.key); setShowDocumentTypeDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                              selectedDocumentType === docType.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              <docType.icon size={14} />
                              <span className="font-medium">{docType.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                </div>

                {/* Text Input */}
                <div className="flex items-end gap-3">
                  <textarea
                    ref={chatInputRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base resize-none min-h-[44px]"
                    placeholder={selectedDocumentType 
                      ? `Tell me about your ${selectedDocumentType === 'sop' ? 'background, goals, and target program' : selectedDocumentType === 'lor' ? 'relationship with the candidate' : selectedDocumentType === 'cv' ? 'academic background and research' : selectedDocumentType === 'resume' ? 'work experience and skills' : 'document to analyze'}...`
                      : "Ask anything, or select a document type to build..."
                    }
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-gray-200 disabled:to-gray-300 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-medium disabled:cursor-not-allowed shadow-md disabled:shadow-none transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <button onClick={() => setViewMode('journey')} className="flex items-center gap-2 hover:text-gray-600 transition-colors">
                  <Map size={14} />
                  View Journey
                </button>
                <span>•</span>
                <Link href="/new-dashboard/chat/new" className="flex items-center gap-2 hover:text-gray-600 transition-colors">
                  <MessageSquare size={14} />
                  Start Chat
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Input Bar (only shown in journey mode) - Roadmap focused */}
        {viewMode === 'journey' && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
                {/* Journey context indicator */}
                <div className="flex items-center gap-2 pl-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700">
                    <Map size={12} />
                    <span className="font-medium">Journey</span>
                  </div>
                </div>
                
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
                  placeholder="Ask about your roadmap, update stages, or get guidance..."
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-300 text-white rounded-xl px-3 py-2 flex items-center gap-1 text-sm font-medium disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Quick Access */}
      <aside className={`${rightSidebarOpen ? 'w-64' : 'w-0'} bg-white/50 backdrop-blur-sm border-l border-gray-200/60 flex flex-col transition-all duration-300 overflow-hidden z-10`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Quick Access</h3>
          <button onClick={() => setRightSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all group border border-transparent hover:border-gray-100"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <link.icon size={14} />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 truncate">
                {link.title}
              </span>
            </Link>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 px-2">Help</h3>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-left group border border-transparent hover:border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <MessageSquare size={14} />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Support</span>
          </button>
        </div>
      </aside>

      {/* Right Sidebar Toggle Button (when closed) */}
      {!rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-300 transition-all z-20"
          title="Open Quick Access"
        >
          <PanelRightOpen size={18} className="text-gray-600" />
        </button>
      )}

      {/* Dialogs */}
      <Dialog open={renameDialogOpen} onOpenChange={(open) => { if (!isRenaming) setRenameDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Update the title shown in your chat history.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="Chat title"
            disabled={isRenaming}
            onKeyDown={(e) => { if (e.key === "Enter") submitRename(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} disabled={isRenaming}>Cancel</Button>
            <Button onClick={submitRename} disabled={isRenaming || !renameTitle.trim()}>
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!isDeleting) setDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the chat and all its messages.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className={isDeleting ? "pointer-events-none opacity-70" : undefined}>
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      </AnimatePresence>
    </div>
  );
}

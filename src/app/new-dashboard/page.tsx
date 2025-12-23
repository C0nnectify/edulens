"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Mic, Sparkles, FileText, Activity, ListChecks, Search, Paperclip, ChevronRight, Plus, Menu, MessageSquare, Clock, X, Zap, ChevronDown, FileEdit, Mail, Briefcase, GraduationCap, Check, AlertCircle, Loader2, File, Image, FileSpreadsheet, Trash2, type LucideIcon } from "lucide-react";
import { sendMessage, uploadFile, getUserFiles, listSessions, getHistory, renameSession, deleteSession, DocumentType, FileAttachment } from "@/lib/api/chatOrchestrator";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
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

type FeatureKey = "document_builder" | "monitoring_agent" | "future_prediction" | "present_analyzer" | null;

type UploadedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  preview?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: Array<{ id: string; title: string; url?: string; snippet?: string }>;
  agentsInvolved?: string[];
  progress?: { percentage: number; collected_fields: string[]; missing_fields: string[] };
  documentDraft?: Record<string, unknown>;
  action?: string;
  documentType?: DocumentType | null;
  draftKey?: string;
  attachments?: UploadedFile[];
};

// Document type options for Document Builder
const documentTypeOptions: Array<{ key: DocumentType | 'analyze'; label: string; description: string; icon: LucideIcon; color: string; bg: string; border: string; text: string }> = [
  {
    key: "sop",
    label: "SOP",
    description: "Statement of Purpose",
    icon: FileEdit,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  {
    key: "lor",
    label: "LOR",
    description: "Letter of Recommendation",
    icon: Mail,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  {
    key: "cv",
    label: "CV",
    description: "Curriculum Vitae",
    icon: GraduationCap,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  {
    key: "resume",
    label: "Resume",
    description: "Professional Resume",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  {
    key: "analyze",
    label: "Analyze",
    description: "Document Analysis",
    icon: Search,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
  },
];


const agentTools: Array<{ key: Exclude<FeatureKey, null>; label: string; description: string; icon: LucideIcon; color: string; bg: string }> = [
  {
    key: "document_builder",
    label: "Document Builder",
    description: "Create SOP, LOR, CV, Resume, and analyze documents with AI assistance.",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "monitoring_agent",
    label: "Application Tracker",
    description: "Track your university applications and monitor their status (Coming soon).",
    icon: ListChecks,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const quickLinks: Array<{ title: string; description: string; href: string; icon: LucideIcon }> = [
  {
    title: 'Document Vault',
    description: 'Browse all your uploaded documents',
    href: '/dashboard/document-ai',
    icon: Upload,
  },
  {
    title: 'SOP Generator',
    description: 'Generate Statement of Purpose',
    href: '/dashboard/document-builder/sop-generator',
    icon: FileText,
  },
  {
    title: 'LOR Generator',
    description: 'Create Letter of Recommendation',
    href: '/dashboard/document-builder/lor-generator',
    icon: FileText,
  },
  {
    title: 'Resume Builder',
    description: 'Build professional resume',
    href: '/dashboard/document-builder/resume',
    icon: FileText,
  },
  {
    title: 'CV Builder',
    description: 'Build academic CV',
    href: '/dashboard/document-builder/cv',
    icon: FileText,
  },
  {
    title: 'Application Tracker',
    description: 'Track university applications',
    href: '/dashboard/application-tracker',
    icon: ListChecks,
  },
  {
    title: 'Monitoring Agent',
    description: 'Monitor application status',
    href: '/dashboard/monitoring-agent',
    icon: Activity,
  },
  {
    title: 'Document AI',
    description: 'Upload & process documents',
    href: '/dashboard/document-ai',
    icon: Upload,
  },
];

type RecentChat = {
  id: string;
  title?: string;
  updatedAt?: string;
  documentType?: DocumentType | null;
};

export default function NewDashboardPage() {
  const [selectedTool, setSelectedTool] = useState<FeatureKey>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | 'analyze' | null>(null);
  const [showDocumentTypeDropdown, setShowDocumentTypeDropdown] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [previousFiles, setPreviousFiles] = useState<FileAttachment[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatActionTarget, setChatActionTarget] = useState<RecentChat | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const filePanelRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

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
      // If deleting the currently opened chat, reset UI.
      if (sessionId === target.id) {
        setMessages([]);
        setSessionId(null);
      }
      setDeleteDialogOpen(false);
      await loadRecentChats();
    } catch (err) {
      console.error("Failed to delete session", err);
    } finally {
      setIsDeleting(false);
    }
  }, [chatActionTarget, sessionId, loadRecentChats]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load previous files when document builder is selected
  useEffect(() => {
    if (selectedTool === "document_builder") {
      loadPreviousFiles();
    }
  }, [selectedTool]);

  // Load recent chat sessions for the sidebar
  useEffect(() => {
    loadRecentChats();
  }, [loadRecentChats]);

  const loadPreviousFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await getUserFiles();
      setPreviousFiles(res.files || []);

      // Best-effort: sync statuses for files already shown in the chip row
      // (e.g., a freshly uploaded doc transitions from processing -> ready).
      setUploadedFiles((prev) =>
        prev.map((f) => {
          const match = (res.files || []).find((pf) => pf.id === f.id);
          if (!match?.status) return f;
          const nextStatus =
            match.status === "completed" ? "ready" : match.status === "failed" ? "error" : "processing";
          return { ...f, status: f.status === "uploading" ? f.status : nextStatus };
        })
      );
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const placeholder = useMemo(() => {
    if (!selectedTool) return "Ask anything. Type @ for mentions and / for shortcuts.";
    
    if (selectedTool === "document_builder" && selectedDocumentType) {
      const docTypeLabels: Record<string, string> = {
        sop: "Tell me about your background, target university, and career goals for your SOP…",
        lor: "Share details about the student/colleague you're recommending…",
        cv: "Attach your CV/resume PDF (or paste details). Include: target role, education, research/projects, experience, skills, publications (if any). Then type: Generate CV",
        resume: "Attach your resume PDF (or paste details). Include: target role, experience + impact bullets, projects, skills, education, certifications. Then type: Generate Resume",
        analyze: "Upload documents to analyze and get insights…",
      };
      return docTypeLabels[selectedDocumentType as string];
    }
    
    const toolPlaceholders: Record<string, string> = {
      document_builder: "Select a document type above to get started…",
      monitoring_agent: "Application tracker feature coming soon…",
    };
    return toolPlaceholders[selectedTool] || "Ask anything…";
  }, [selectedTool, selectedDocumentType]);

  useEffect(() => {
    setSessionId(null);
  }, []);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (documentTypeDropdownRef.current && !documentTypeDropdownRef.current.contains(e.target as Node)) {
        setShowDocumentTypeDropdown(false);
      }
      if (filePanelRef.current && !filePanelRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-file-trigger]')) {
        setShowFilePanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset document type when tool changes
  const handleToolSelect = useCallback((tool: FeatureKey) => {
    if (selectedTool === tool) {
      setSelectedTool(null);
      setSelectedDocumentType(null);
    } else {
      setSelectedTool(tool);
      if (tool !== "document_builder") {
        setSelectedDocumentType(null);
        setShowFilePanel(false);
      }
    }
  }, [selectedTool]);

  const onUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newFile: UploadedFile = {
        id: tempId,
        name: file.name,
        type: file.type,
        size: file.size,
        status: "uploading",
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      try {
        const docType = selectedDocumentType === "cv" ? "cv" : 
                       selectedDocumentType === "resume" ? "resume" : 
                       selectedDocumentType === "lor" ? "lor" : "document";
        const result = await uploadFile(file, docType);

        const mappedStatus: UploadedFile["status"] =
          result.status === "completed" ? "ready" : result.status === "failed" ? "error" : "processing";
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { ...f, id: result.documentId, status: mappedStatus }
            : f
        ));
        setSelectedFileIds(prev => [...prev, result.documentId]);
      } catch (err) {
        console.error("Upload failed:", err);
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId ? { ...f, status: "error" as const } : f
        ));
      }
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedDocumentType]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFileIds(prev => prev.filter(id => id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return Image;
    if (type.includes("pdf")) return FileText;
    if (type.includes("spreadsheet") || type.includes("excel")) return FileSpreadsheet;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSend = useCallback(async () => {
    if (!input.trim()) return;
    
    // For document builder, require document type selection
    if (selectedTool === "document_builder" && !selectedDocumentType) {
      setMessages((prev) => [...prev, { 
        id: `hint-${Date.now()}`, 
        role: "ai", 
        content: "Please select a document type (SOP, LOR, CV, or Resume) before starting the conversation." 
      }]);
      return;
    }
    
    const text = input.trim();

    const normalizeCmd = (value: string) =>
      value
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/g, "")
        .trim();

    const lines = text.split(/\r?\n/);
    const lastLine = (lines[lines.length - 1] ?? "").trim();
    const normalizedCmd = normalizeCmd(text);
    const normalizedLastLine = normalizeCmd(lastLine);

    const resumeDraftTriggers = ["generate resume", "make resume", "create resume", "build resume"];
    const cvDraftTriggers = ["generate cv", "make cv", "create cv", "build cv"];

    const containsAnyTrigger = (haystack: string, triggers: string[]) =>
      triggers.some((t) => haystack.includes(t));

    const wantsGenerateDraft =
      selectedTool === "document_builder" &&
      (selectedDocumentType === "resume"
        ? containsAnyTrigger(normalizedCmd, resumeDraftTriggers) || containsAnyTrigger(normalizedLastLine, resumeDraftTriggers)
        : selectedDocumentType === "cv"
          ? containsAnyTrigger(normalizedCmd, cvDraftTriggers) || containsAnyTrigger(normalizedLastLine, cvDraftTriggers)
          : false);

    const stripDraftTriggers = (raw: string) => {
      const triggers = selectedDocumentType === "resume" ? resumeDraftTriggers : selectedDocumentType === "cv" ? cvDraftTriggers : [];
      if (triggers.length === 0) return raw;
      let out = raw;
      for (const t of triggers) {
        // Remove trigger phrases even when embedded in other text.
        out = out.replace(new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&")}\\b`, "ig"), "");
      }
      return out.replace(/\s+/g, " ").trim();
    };

    // If user ended their message with the command, strip it from the backend message.
    let messageForBackend = text;
    if (wantsGenerateDraft) {
      // Prefer stripping from the whole message so button labels like
      // "Using this resume PDF Generate Resume" still work.
      messageForBackend = stripDraftTriggers(text);
      if (!messageForBackend) {
        messageForBackend = selectedDocumentType === "cv"
          ? "Please generate a structured CV draft from the selected attachments."
          : "Please generate a structured resume draft from the selected attachments.";
      }
    }

    // Attachments shown under the user's message should include both:
    // - freshly uploaded files (uploadedFiles)
    // - previously uploaded files (previousFiles)
    // The backend already receives IDs via attachmentIds; this is purely for UI display.
    const previousAsUploaded: UploadedFile[] = previousFiles
      .filter((f) => selectedFileIds.includes(f.id))
      .map((f) => {
        const mappedStatus: UploadedFile["status"] =
          f.status === "failed" ? "error" : f.status === "completed" ? "ready" : "processing";
        return {
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          status: mappedStatus,
        };
      });

    const uploadedSelected = uploadedFiles.filter((f) => selectedFileIds.includes(f.id));
    const currentAttachments = [...uploadedSelected, ...previousAsUploaded.filter((pf) => !uploadedSelected.some((uf) => uf.id === pf.id))];
    
    setInput("");
    // Collapse the auto-growing textarea after send.
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
    }
    const localId = `m-${Date.now()}`;
    setMessages((prev) => [...prev, { 
      id: localId, 
      role: "user", 
      content: text,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    }]);
    setIsSending(true);
    
    try {
      const feature: "document_builder" | "monitoring_agent" | "general" | "tracker" | "analysis" | "roadmap" =
        selectedTool === "future_prediction"
          ? "roadmap"
          : selectedTool === "present_analyzer"
          ? "analysis"
          : (selectedTool ?? "general");

      const res = await sendMessage({
        sessionId: sessionId || undefined,
        message: messageForBackend,
        feature,
        documentType: selectedTool === "document_builder" && selectedDocumentType !== 'analyze' ? selectedDocumentType : undefined,
        // IMPORTANT: these are canonical FastAPI document_ids
        // Always send the array so empty selection clears sticky context.
        attachmentIds: selectedFileIds,
        generateDraft: wantsGenerateDraft,
      });
      
      if (res.sessionId && res.sessionId !== sessionId) setSessionId(res.sessionId);

      // If a document draft was generated (e.g., SOP via Document Builder),
      // persist it in localStorage so the dedicated editor can load it.
      let draftKey: string | undefined;
      if (typeof window !== "undefined" && res.documentDraft && selectedTool === "document_builder" && selectedDocumentType !== 'analyze') {
        try {
          const docType: DocumentType | null = selectedDocumentType as DocumentType || null;
          const payload = {
            documentType: docType,
            documentDraft: res.documentDraft,
          };
          draftKey = `docbuilder-draft-${res.sessionId}-${Date.now()}`;
          window.localStorage.setItem(draftKey, JSON.stringify(payload));
        } catch (e) {
          console.error("Failed to persist document draft", e);
        }
      }
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: res.answer || "",
        sources: res.sources,
        agentsInvolved: res.agentsInvolved,
        progress: res.progress,
        documentDraft: res.documentDraft,
        action: res.action,
        documentType: selectedTool === "document_builder" && selectedDocumentType !== 'analyze' ? selectedDocumentType as DocumentType : null,
        draftKey,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Refresh chat sessions so the sidebar shows the latest conversation.
      loadRecentChats();

      // Keep selected files sticky across turns.
      // The chat-orchestrator supports sticky attachment context; clearing here
      // would unintentionally drop document context on the next message.
      
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "ai", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  }, [input, selectedTool, selectedDocumentType, sessionId, selectedFileIds, uploadedFiles, previousFiles, loadRecentChats]);

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Left Sidebar - Chat History (Collapsible) */}
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
          <button 
            onClick={() => {
              setMessages([]);
              setSelectedTool(null);
              setSelectedDocumentType(null);
              setSessionId(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium text-sm"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="px-3 py-2 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Clock size={12} />
            Recent Chats
          </div>
          <div className="space-y-1.5">
            {recentChats.map((chat, index) => (
              <div
                key={`${chat.id}-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  (async () => {
                    try {
                      const history = await getHistory(chat.id);
                      const mapped: ChatMessage[] = history.messages.map((m, idx) => {
                        const role = m.role === "user" ? "user" : "ai";

                        // Recreate a draftKey on-demand so the editor CTA works even after reload.
                        let draftKey: string | undefined;
                        const docType = (m.documentType ?? history.document_type ?? chat.documentType ?? null) as DocumentType | null;
                        if (typeof window !== "undefined" && role === "ai" && m.documentDraft && docType) {
                          try {
                            draftKey = `docbuilder-draft-${chat.id}-${idx}-${Date.now()}`;
                            window.localStorage.setItem(
                              draftKey,
                              JSON.stringify({ documentType: docType, documentDraft: m.documentDraft })
                            );
                          } catch (e) {
                            console.error("Failed to restore draft to localStorage", e);
                          }
                        }

                        return {
                          id: `${chat.id}-${idx}`,
                          role,
                          content: m.content,
                          sources: role === "ai" ? (m.sources ?? undefined) : undefined,
                          agentsInvolved: role === "ai" ? (m.agentsInvolved ?? undefined) : undefined,
                          progress: role === "ai" && m.progress ? (m.progress as ChatMessage['progress']) : undefined,
                          documentDraft: role === "ai" ? (m.documentDraft ?? undefined) : undefined,
                          action: role === "ai" ? (m.action ?? undefined) : undefined,
                          documentType: role === "ai" ? docType : null,
                          draftKey,
                        } as ChatMessage;
                      });
                      setMessages(mapped);
                      setSessionId(chat.id);
                      const effectiveDocType =
                        history.document_type &&
                        (history.document_type === "sop" ||
                          history.document_type === "lor" ||
                          history.document_type === "cv" ||
                          history.document_type === "resume")
                          ? history.document_type
                          : chat.documentType &&
                            (chat.documentType === "sop" ||
                              chat.documentType === "lor" ||
                              chat.documentType === "cv" ||
                              chat.documentType === "resume")
                          ? chat.documentType
                          : null;

                      if (effectiveDocType) {
                        setSelectedTool("document_builder");
                        setSelectedDocumentType(effectiveDocType);
                      }
                    } catch (e) {
                      console.error("Failed to load history", e);
                    }
                  })();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    (e.currentTarget as HTMLDivElement).click();
                  }
                }}
                className="w-full group relative"
              >
                <div className="flex flex-col gap-1.5 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-200 hover:shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 line-clamp-1 block">
                        {chat.title ||
                          (chat.documentType === "sop"
                            ? "SOP Builder Session"
                            : chat.documentType === "lor"
                            ? "LOR Builder Session"
                            : chat.documentType === "cv"
                            ? "CV Builder Session"
                            : chat.documentType === "resume"
                            ? "Resume Builder Session"
                            : "Document Builder Session")}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {chat.documentType && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                            {chat.documentType.toUpperCase()}
                          </span>
                        )}
                        {chat.updatedAt && (
                          <span className="text-xs text-gray-500 truncate">
                            {new Date(chat.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover actions: Rename / Delete */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openRename(chat);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-500 hover:text-gray-700"
                        aria-label="Rename chat"
                        title="Rename"
                      >
                        <FileEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDelete(chat);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-500 hover:text-gray-700"
                        aria-label="Delete chat"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center relative overflow-hidden">
        {/* Top Header */}
        <div className="w-full border-b border-gray-200/50 bg-white/60 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100/80 rounded-xl transition-colors text-gray-600"
                >
                  <Menu size={20} />
                </button>
              )}
              <button className="px-3 py-1.5 bg-gray-100/50 hover:bg-gray-100 border border-gray-200/50 rounded-lg text-sm transition-all text-gray-600 font-medium flex items-center gap-2 hover:shadow-sm">
                <Search size={14} />
                Focus
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <span className="text-gray-600">AI Orchestrator</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">Multi-Agent System</span>
            </div>
          </div>
        </div>

        {/* Chat Messages or Tool Selection */}
        <div className="flex-1 w-full flex overflow-hidden relative">
          <div className="flex-1 max-w-5xl px-6 overflow-y-auto mx-auto custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="w-full max-w-3xl space-y-10">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 rotate-3 hover:rotate-6 transition-transform duration-500">
                      <Sparkles size={40} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Ask anything</h2>
                    <p className="text-lg text-gray-500 font-medium">Pick a feature from below or start typing</p>
                  </div>

                  {/* Agent Tool Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {agentTools.map((tool) => (
                      <button
                        key={tool.key}
                        onClick={() => handleToolSelect(tool.key)}
                        className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border ${
                          selectedTool === tool.key
                            ? `border-blue-200 ring-4 ring-blue-50 shadow-xl shadow-blue-100 scale-[1.02] bg-white`
                            : 'border-gray-200/60 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className={`absolute inset-0 ${tool.bg} opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                        <div className="relative flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center ${tool.color} shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                            <tool.icon size={22} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5">{tool.label}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                          </div>
                          {selectedTool === tool.key && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 animate-in zoom-in duration-300">
                                <Zap size={14} className="text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Document Type Selection - Shows when Document Builder is selected */}
                  {selectedTool === "document_builder" && (
                    <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Select document type</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {documentTypeOptions.map((docType) => (
                          <button
                            key={docType.key}
                            onClick={() => setSelectedDocumentType(docType.key)}
                            className={`group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 border ${
                              selectedDocumentType === docType.key
                                ? `${docType.border} ${docType.bg} shadow-md ring-1 ring-offset-1 ring-transparent`
                                : 'border-gray-200/60 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3 py-1">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                                selectedDocumentType === docType.key 
                                  ? 'bg-white shadow-sm' 
                                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                              } ${selectedDocumentType === docType.key ? docType.color : ''}`}>
                                <docType.icon size={18} />
                              </div>
                              <div className="text-center">
                                <h4 className={`text-sm font-bold ${
                                  selectedDocumentType === docType.key ? docType.text : 'text-gray-700'
                                }`}>{docType.label}</h4>
                                <p className={`text-[10px] mt-1 font-medium leading-tight ${
                                  selectedDocumentType === docType.key ? docType.text : 'text-gray-400'
                                } opacity-80`}>{docType.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>


                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-8" ref={chatContainerRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] ${m.role === "user" ? "order-2" : "order-1"}`}>
                      {/* Message Bubble */}
                      <div className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                        m.role === "user" 
                          ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm" 
                          : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                      }`}>
                        {m.role === "user" ? (
                          <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{m.content}</div>
                        ) : (
                          <MarkdownContent content={m.content} className="text-[15px] prose-sm prose-blue" />
                        )}
                      </div>
                      
                      {/* Attachments Display */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.attachments.map((file, idx) => {
                            const FileIcon = getFileIcon(file.type);
                            return (
                              <div
                                key={`msg-att-${m.id}-${idx}-${file.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                              >
                                <FileIcon size={14} className="text-gray-500" />
                                <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Document Progress Indicator */}
                      {m.progress && m.role === "ai" && (
                        <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Document Progress</span>
                            <span className="text-sm font-bold text-blue-600">{m.progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${m.progress.percentage}%` }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {m.progress.collected_fields.map((field) => (
                              <span key={field} className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                <Check size={10} /> {field}
                              </span>
                            ))}
                            {m.progress.missing_fields.map((field) => (
                              <span key={field} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Link to open generated document in the appropriate editor */}
                      {m.role === "ai" &&
                        m.documentDraft &&
                        m.draftKey && (
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="text-xs text-blue-900">
                              A full draft has been generated. Open it in the dedicated editor to fine-tune formatting, save, and export.
                            </div>
                            {m.documentType === "lor" ? (
                              <Link
                                href={`/dashboard/document-builder/lor-generator?draftKey=${encodeURIComponent(m.draftKey)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <FileEdit size={12} />
                                <span>Open in LOR Editor</span>
                              </Link>
                            ) : m.documentType === "sop" ? (
                              <Link
                                href={`/dashboard/document-builder/sop-generator?draftKey=${encodeURIComponent(m.draftKey)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <FileEdit size={12} />
                                <span>Open in SOP Editor</span>
                              </Link>
                            ) : m.documentType === "resume" ? (
                              <Link
                                href={`/dashboard/document-builder/resume/editor-v2?draftKey=${encodeURIComponent(m.draftKey)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <FileEdit size={12} />
                                <span>Open in Resume Builder</span>
                              </Link>
                            ) : m.documentType === "cv" ? (
                              <Link
                                href={`/dashboard/document-builder/cv/editor-v2?draftKey=${encodeURIComponent(m.draftKey)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <FileEdit size={12} />
                                <span>Open in CV Builder</span>
                              </Link>
                            ) : null}
                          </div>
                        )}
                      
                      {/* Sources */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                              {m.sources.map((s, idx) => (
                                <div key={`${s.id}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                              <div className="text-sm font-medium text-gray-900">{s.title}</div>
                              {s.snippet && <div className="text-xs text-gray-600 mt-1 line-clamp-2">{s.snippet}</div>}
                              {s.url && (
                                <a className="text-xs text-blue-600 hover:underline mt-2 inline-block" href={s.url} target="_blank" rel="noreferrer">
                                  View source →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Agents Involved */}
                      {m.agentsInvolved && m.agentsInvolved.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          {m.agentsInvolved.map((agent) => (
                            <span key={agent} className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] rounded-full font-medium">
                              {agent}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Quick Links */}
          <aside className="w-64 border-l border-gray-200/60 bg-white/50 backdrop-blur-sm py-5 px-4 overflow-y-auto flex-shrink-0 hidden xl:block">
            <div className="space-y-6">
              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3 px-2 font-bold">Quick Access</h3>
                <div className="space-y-1.5">
                  {quickLinks.map((link, index) => {
                    const gradients = [
                      'from-blue-500 to-indigo-600',
                      'from-purple-500 to-pink-600',
                      'from-violet-500 to-purple-600',
                      'from-cyan-500 to-blue-600',
                      'from-emerald-500 to-teal-600',
                      'from-green-500 to-emerald-600',
                      'from-orange-500 to-red-600',
                    ];
                    return (
                      <Link
                        key={index}
                        href={link.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 transition-all group border border-transparent hover:border-gray-100"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          <link.icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 truncate">
                          {link.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-200/60 pt-4">
                <h3 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3 px-2 font-bold">Help</h3>
                <div className="space-y-1.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 transition-all text-left group border border-transparent hover:border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <MessageSquare size={14} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Support</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 transition-all text-left group border border-transparent hover:border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <FileText size={14} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Docs</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Input Area */}
        <div className="w-full bg-gradient-to-t from-white via-white to-transparent pb-6 pt-2 px-6 z-20">
          <div className="max-w-4xl mx-auto">
            {selectedTool && (
              <div className="mb-3 flex items-center gap-2 flex-wrap animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-full text-sm shadow-sm">
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${agentTools.find(t => t.key === selectedTool)?.color} flex items-center justify-center text-white`}>
                    {(() => {
                      const Icon = agentTools.find(t => t.key === selectedTool)?.icon;
                      return Icon ? <Icon size={10} /> : null;
                    })()}
                  </div>
                  <span className="font-medium text-blue-900 text-xs">{agentTools.find(t => t.key === selectedTool)?.label}</span>
                  <button
                    onClick={() => { setSelectedTool(null); setSelectedDocumentType(null); }}
                    className="ml-1 text-blue-400 hover:text-blue-700 p-0.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                {/* Document Type Badge - when Document Builder with type selected */}
                {selectedTool === "document_builder" && selectedDocumentType && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50/80 backdrop-blur-sm border border-purple-200/60 rounded-full text-sm shadow-sm">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${documentTypeOptions.find(d => d.key === selectedDocumentType)?.color} flex items-center justify-center text-white`}>
                      {(() => {
                        const Icon = documentTypeOptions.find(d => d.key === selectedDocumentType)?.icon;
                        return Icon ? <Icon size={10} /> : null;
                      })()}
                    </div>
                    <span className="font-medium text-purple-900 text-xs">{documentTypeOptions.find(d => d.key === selectedDocumentType)?.label}</span>
                    <button
                      onClick={() => setSelectedDocumentType(null)}
                      className="ml-1 text-purple-400 hover:text-purple-700 p-0.5 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {/* Dropdown to change document type inline */}
                {selectedTool === "document_builder" && (
                  <div className="relative" ref={documentTypeDropdownRef}>
                    <button
                      onClick={() => setShowDocumentTypeDropdown(!showDocumentTypeDropdown)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-200"
                    >
                      <ChevronDown size={12} className={`transition-transform ${showDocumentTypeDropdown ? 'rotate-180' : ''}`} />
                      <span>{selectedDocumentType ? 'Change' : 'Select type'}</span>
                    </button>
                    {showDocumentTypeDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[180px] z-30 animate-in zoom-in-95 duration-200">
                        {documentTypeOptions.map((docType) => (
                          <button
                            key={docType.key}
                            onClick={() => {
                              setSelectedDocumentType(docType.key);
                              setShowDocumentTypeDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
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
                )}
              </div>
            )}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-3xl shadow-2xl shadow-gray-200/50 hover:border-blue-300/50 hover:shadow-blue-500/10 transition-all duration-300 ring-1 ring-gray-100">
              {/* Selected Files Preview - Shows both uploaded and selected previous files */}
              {(uploadedFiles.length > 0 || selectedFileIds.length > 0) && (
                <div className="px-4 pt-3 pb-1 border-b border-gray-100/50">
                  <div className="flex flex-wrap gap-2">
                    {/* Show newly uploaded files */}
                    {uploadedFiles.map((file, idx) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <div 
                          key={`upload-${file.id}-${idx}`} 
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border shadow-sm ${
                            file.status === "uploading" ? "bg-blue-50 border-blue-200" :
                            file.status === "processing" ? "bg-amber-50 border-amber-200" :
                            file.status === "error" ? "bg-red-50 border-red-200" :
                            "bg-white border-gray-200"
                          }`}
                        >
                          {file.status === "uploading" || file.status === "processing" ? (
                            <Loader2 size={12} className="animate-spin text-blue-500" />
                          ) : file.status === "error" ? (
                            <AlertCircle size={12} className="text-red-500" />
                          ) : (
                            <>
                              <FileIcon size={12} className="text-green-600" />
                              <Check size={12} className="text-green-600" />
                            </>
                          )}
                          <span className="max-w-[100px] truncate font-medium text-gray-700">{file.name}</span>
                          <span className="text-gray-400">{formatFileSize(file.size)}</span>
                          <button 
                            onClick={() => removeUploadedFile(file.id)}
                            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Show selected previous files as chips */}
                    {previousFiles
                      .filter(pf => selectedFileIds.includes(pf.id) && !uploadedFiles.find(uf => uf.id === pf.id))
                      .map((file, idx) => {
                        const FileIcon = getFileIcon(file.type);
                        const chipStatus = file.status === "failed" ? "error" : file.status === "completed" ? "ready" : "processing";
                        return (
                          <div 
                            key={`prev-chip-${file.id}-${idx}`} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border shadow-sm ${
                              chipStatus === "processing" ? "bg-amber-50 border-amber-200" :
                              chipStatus === "error" ? "bg-red-50 border-red-200" :
                              "bg-white border-gray-200"
                            }`}
                          >
                            {chipStatus === "processing" ? (
                              <Loader2 size={12} className="animate-spin text-amber-600" />
                            ) : chipStatus === "error" ? (
                              <AlertCircle size={12} className="text-red-500" />
                            ) : (
                              <>
                                <FileIcon size={12} className="text-green-600" />
                                <Check size={12} className="text-green-600" />
                              </>
                            )}
                            <span className="max-w-[100px] truncate font-medium text-gray-700">{file.name}</span>
                            <span className="text-gray-400">{formatFileSize(file.size)}</span>
                            <button 
                              onClick={() => toggleFileSelection(file.id)}
                              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove attachment"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 p-2 pl-4">
                <button 
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-2 rounded-xl"
                  onClick={() => setShowFilePanel(!showFilePanel)}
                  data-file-trigger
                  title="Attach files"
                >
                  <Plus size={20} />
                </button>
                <button 
                  onClick={onUploadClick}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-2 rounded-xl"
                  title="Upload new file"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 flex items-center py-2">
                  <textarea
                    ref={chatInputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-grow up to a reasonable height.
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-[15px] px-2 font-medium resize-none leading-relaxed"
                    placeholder={placeholder}
                    disabled={isSending}
                  />
                </div>
                <button
                  onClick={() => alert("Voice input coming soon")}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-2 rounded-xl"
                  title="Voice input"
                >
                  <Mic size={20} />
                </button>

                <button
                  onClick={onSend}
                  disabled={isSending || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 text-white rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 font-medium disabled:cursor-not-allowed shadow-md shadow-blue-500/20 disabled:shadow-none m-1"
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  className="hidden" 
                  onChange={onFileSelected} 
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
              </div>
              
              {/* File Panel - shows previous files */}
              {showFilePanel && selectedTool === "document_builder" && (
                <div ref={filePanelRef} className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-3xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Previously Uploaded Files</span>
                    <button 
                      onClick={loadPreviousFiles}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-blue-500" />
                    </div>
                  ) : previousFiles.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                      No files uploaded yet. Upload a CV, transcript, or other document to use {selectedDocumentType === 'analyze' ? 'for analysis' : `in your ${selectedDocumentType?.toUpperCase() || "document"}`}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {previousFiles.map((file, idx) => {
                        const FileIcon = getFileIcon(file.type);
                        const isSelected = selectedFileIds.includes(file.id);
                        const status = file.status === "failed" ? "error" : file.status === "completed" ? "ready" : "processing";
                        return (
                          <button
                            key={`prev-${file.id}-${idx}`}
                            onClick={() => toggleFileSelection(file.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition-all border ${
                              isSelected 
                                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                                : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-700"
                            }`}
                          >
                            {status === "processing" ? (
                              <Loader2 size={16} className="animate-spin text-amber-600" />
                            ) : status === "error" ? (
                              <AlertCircle size={16} className="text-red-500" />
                            ) : (
                              <FileIcon size={16} className={isSelected ? "text-blue-500" : "text-gray-400"} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium text-[13px]">{file.name}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(file.size)}</div>
                            </div>
                            {isSelected && <Check size={16} className="text-blue-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-[11px] font-medium text-gray-400">
              <button className="hover:text-gray-600 transition-colors">Try Assistant</button>
              <button className="hover:text-gray-600 transition-colors">Customize</button>
              <button className="hover:text-gray-600 transition-colors">Invite Friends</button>
            </div>
          </div>
        </div>

        {/* Rename chat dialog */}
        <Dialog
          open={renameDialogOpen}
          onOpenChange={(open) => {
            if (isRenaming) return;
            setRenameDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename chat</DialogTitle>
              <DialogDescription>Update the title shown in your chat history.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Chat title"
                maxLength={120}
                disabled={isRenaming}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitRename();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitRename()}
                disabled={isRenaming || !renameTitle.trim() || !chatActionTarget}
              >
                {isRenaming ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete chat dialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (isDeleting) return;
            setDeleteDialogOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the chat and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void confirmDelete();
                }}
                className={isDeleting ? "pointer-events-none opacity-70" : undefined}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

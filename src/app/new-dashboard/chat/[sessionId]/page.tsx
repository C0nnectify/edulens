"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Mic, Sparkles, FileText, Search, Paperclip, ChevronRight, Plus, 
  X, ChevronDown, FileEdit, Mail, Briefcase, GraduationCap, Check, AlertCircle, 
  Loader2, File, Image, FileSpreadsheet, ArrowLeft, Map, type LucideIcon 
} from "lucide-react";
import { sendMessage, sendJourneyMessage, uploadFile, getUserFiles, getHistory, DocumentType, FileAttachment } from "@/lib/api/chatOrchestrator";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { motion } from "framer-motion";

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
  savedDocId?: string; // ID of the saved document (SOP/LOR) if already saved
};

// Document type options for Document Builder
const documentTypeOptions: Array<{ key: DocumentType | 'analyze'; label: string; description: string; icon: LucideIcon; color: string; bg: string; border: string; text: string }> = [
  { key: "sop", label: "SOP", description: "Statement of Purpose", icon: FileEdit, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  { key: "lor", label: "LOR", description: "Letter of Recommendation", icon: Mail, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { key: "cv", label: "CV", description: "Curriculum Vitae", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { key: "resume", label: "Resume", description: "Professional Resume", icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  { key: "analyze", label: "Analyze", description: "Document Analysis", icon: Search, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
];

const agentTools: Array<{ key: Exclude<FeatureKey, null>; label: string; icon: LucideIcon }> = [
  { key: "document_builder", label: "Document Builder", icon: FileText },
];

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [selectedTool, setSelectedTool] = useState<FeatureKey>("document_builder");
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | 'analyze' | null>(null);
  const [showDocumentTypeDropdown, setShowDocumentTypeDropdown] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [previousFiles, setPreviousFiles] = useState<FileAttachment[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [pendingMessageProcessed, setPendingMessageProcessed] = useState(false);
  const [isJourneyMode, setIsJourneyMode] = useState(false);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const filePanelRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const getBootstrapKey = useCallback((id: string) => `chat-bootstrap-${id}`, []);

  // If we were redirected from /chat/new -> /chat/{id}, restore messages immediately
  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (typeof window === 'undefined') return;
    if (!sessionId || sessionId === 'new') return;

    const key = getBootstrapKey(sessionId);
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        messages?: ChatMessage[];
        selectedTool?: FeatureKey;
        selectedDocumentType?: DocumentType | 'analyze' | null;
        isJourneyMode?: boolean;
      };

      if (typeof parsed.isJourneyMode === 'boolean') setIsJourneyMode(parsed.isJourneyMode);
      if (parsed.selectedTool !== undefined) setSelectedTool(parsed.selectedTool);
      if (parsed.selectedDocumentType !== undefined) setSelectedDocumentType(parsed.selectedDocumentType);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
      }

      bootstrappedRef.current = true;
    } catch (e) {
      console.error('Failed to parse chat bootstrap', e);
    } finally {
      window.sessionStorage.removeItem(key);
      setIsLoadingHistory(false);
    }
  }, [sessionId, getBootstrapKey]);

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      if (bootstrappedRef.current) {
        setIsLoadingHistory(false);
        return;
      }
      if (sessionId === 'new') {
        setIsLoadingHistory(false);
        return;
      }
      try {
        const history = await getHistory(sessionId);
        const mapped: ChatMessage[] = history.messages.map((m, idx) => {
          const role = m.role === "user" ? "user" : "ai";
          let draftKey: string | undefined;
          const docType = (m.documentType ?? history.document_type ?? null) as DocumentType | null;
          if (typeof window !== "undefined" && role === "ai" && m.documentDraft && docType) {
            try {
              draftKey = `docbuilder-draft-${sessionId}-${idx}-${Date.now()}`;
              window.localStorage.setItem(draftKey, JSON.stringify({ documentType: docType, documentDraft: m.documentDraft }));
            } catch (e) {
              console.error("Failed to restore draft", e);
            }
          }
          return {
            id: `${sessionId}-${idx}`,
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
        
        const effectiveDocType = history.document_type as DocumentType | null;
        if (effectiveDocType) {
          setSelectedTool("document_builder");
          setSelectedDocumentType(effectiveDocType);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load files
  useEffect(() => {
    if (selectedTool === "document_builder") {
      loadPreviousFiles();
    }
  }, [selectedTool]);

  // Close dropdown on outside click
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

  const loadPreviousFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await getUserFiles();
      setPreviousFiles(res.files || []);
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const placeholder = useMemo(() => {
    if (!selectedTool) return "Ask anything...";
    if (selectedTool === "document_builder" && selectedDocumentType) {
      const docTypeLabels: Record<string, string> = {
        sop: "Tell me about your background, target university, and career goals...",
        lor: "Share details about the student/colleague you're recommending...",
        cv: "Describe your education, research, publications...",
        resume: "Describe your experience, skills, projects...",
        analyze: "Upload documents to analyze...",
      };
      return docTypeLabels[selectedDocumentType as string];
    }
    return "Select a document type to get started...";
  }, [selectedTool, selectedDocumentType]);

  const onUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newFile: UploadedFile = { id: tempId, name: file.name, type: file.type, size: file.size, status: "uploading" };
      setUploadedFiles(prev => [...prev, newFile]);
      
      try {
        const docType = selectedDocumentType === "cv" ? "cv" : selectedDocumentType === "resume" ? "resume" : selectedDocumentType === "lor" ? "lor" : "document";
        const result = await uploadFile(file, docType);
        const mappedStatus: UploadedFile["status"] = result.status === "completed" ? "ready" : result.status === "failed" ? "error" : "processing";
        setUploadedFiles(prev => prev.map(f => f.id === tempId ? { ...f, id: result.documentId, status: mappedStatus } : f));
        setSelectedFileIds(prev => [...prev, result.documentId]);
      } catch (err) {
        console.error("Upload failed:", err);
        setUploadedFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: "error" as const } : f));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedDocumentType]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
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

  // Save SOP/LOR draft and open in editor
  const handleOpenInEditor = useCallback(async (message: ChatMessage) => {
    if (!message.documentDraft || !message.documentType) return;
    
    const docType = message.documentType;
    if (docType !== 'sop' && docType !== 'lor') return;
    
    // If already saved, just navigate to the editor with the saved ID
    if (message.savedDocId) {
      const basePath = docType === 'lor' 
        ? '/dashboard/document-builder/lor-generator'
        : '/dashboard/document-builder/sop-generator';
      router.push(`${basePath}?id=${encodeURIComponent(message.savedDocId)}`);
      return;
    }
    
    setSavingDraftId(message.id);
    
    try {
      const draft = message.documentDraft as { editor_json?: Record<string, unknown>; html?: string; title?: string };
      const editorJson = draft.editor_json || draft;
      const html = draft.html || '';
      
      // Extract title from editor JSON or use default
      let title = draft.title || '';
      if (!title && editorJson && typeof editorJson === 'object') {
        const content = (editorJson as { content?: Array<{ type: string; attrs?: { level?: number }; content?: Array<{ text?: string }> }> }).content;
        if (content) {
          const h1 = content.find(n => n.type === 'heading' && n.attrs?.level === 1);
          if (h1?.content) {
            title = h1.content.map(c => c.text || '').join('');
          }
        }
      }
      if (!title) {
        title = docType === 'lor' ? 'Letter of Recommendation' : 'My Statement of Purpose';
      }
      
      // Save to database
      const response = await fetch('/api/sop/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          editor_json: editorJson,
          html,
          metadata: { doc_type: docType },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save document');
      }
      
      const { sop_id } = await response.json();
      
      // Update the message with the saved ID so subsequent clicks use "update" mode
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, savedDocId: sop_id } : m
      ));
      
      // Navigate to editor with the saved document ID
      const basePath = docType === 'lor' 
        ? '/dashboard/document-builder/lor-generator'
        : '/dashboard/document-builder/sop-generator';
      router.push(`${basePath}?id=${encodeURIComponent(sop_id)}`);
      
    } catch (err) {
      console.error('Failed to save draft:', err);
      // Fallback: open with draftKey if save fails
      if (message.draftKey) {
        const basePath = docType === 'lor' 
          ? '/dashboard/document-builder/lor-generator'
          : '/dashboard/document-builder/sop-generator';
        router.push(`${basePath}?draftKey=${encodeURIComponent(message.draftKey)}`);
      }
    } finally {
      setSavingDraftId(null);
    }
  }, [router]);

  const onSend = useCallback(async (override?: {
    text?: string;
    tool?: FeatureKey;
    documentType?: DocumentType | 'analyze' | null;
    isJourney?: boolean;
  }) => {
    const text = (override?.text ?? input).trim();
    if (!text) return;

    const effectiveTool = override?.tool ?? selectedTool;
    const effectiveDocumentType = override?.documentType ?? selectedDocumentType;
    const effectiveIsJourney = override?.isJourney ?? isJourneyMode;
    
    // Skip document type check for Journey mode
    if (!effectiveIsJourney && effectiveTool === "document_builder" && !effectiveDocumentType) {
      setMessages(prev => [...prev, { id: `hint-${Date.now()}`, role: "ai", content: "Please select a document type first." }]);
      return;
    }

    const normalizeCmd = (value: string) => value.toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/g, "").trim();
    const normalizedCmd = normalizeCmd(text);

    const resumeDraftTriggers = ["generate resume", "make resume", "create resume", "build resume"];
    const cvDraftTriggers = ["generate cv", "make cv", "create cv", "build cv"];
    const containsAnyTrigger = (haystack: string, triggers: string[]) => triggers.some(t => haystack.includes(t));

    const wantsGenerateDraft = effectiveTool === "document_builder" && (
      (effectiveDocumentType === "resume" && containsAnyTrigger(normalizedCmd, resumeDraftTriggers)) ||
      (effectiveDocumentType === "cv" && containsAnyTrigger(normalizedCmd, cvDraftTriggers))
    );

    const previousAsUploaded: UploadedFile[] = previousFiles.filter(f => selectedFileIds.includes(f.id)).map(f => ({
      id: f.id, name: f.name, type: f.type, size: f.size,
      status: f.status === "failed" ? "error" : f.status === "completed" ? "ready" : "processing" as UploadedFile["status"],
    }));
    const uploadedSelected = uploadedFiles.filter(f => selectedFileIds.includes(f.id));
    const currentAttachments = [...uploadedSelected, ...previousAsUploaded.filter(pf => !uploadedSelected.some(uf => uf.id === pf.id))];
    
    if (!override?.text) {
      setInput("");
    }
    if (chatInputRef.current) chatInputRef.current.style.height = "auto";
    
    const localId = `m-${Date.now()}`;
    setMessages(prev => [...prev, { id: localId, role: "user", content: text, attachments: currentAttachments.length > 0 ? currentAttachments : undefined }]);
    setIsSending(true);
    
    try {
      // Handle Journey mode differently
      if (effectiveIsJourney) {
        const currentSessionId = sessionId === 'new' ? undefined : sessionId;
        const journeyRes = await sendJourneyMessage(text, currentSessionId);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: journeyRes.response || "",
        };

        const systemMsgs: ChatMessage[] = [];
        if (journeyRes.roadmap_updates && Object.keys(journeyRes.roadmap_updates).length > 0) {
          systemMsgs.push({
            id: `system-roadmap-${Date.now()}`,
            role: "ai",
            content: "✅ Your roadmap has been updated based on our conversation.",
          });
        }
        if (journeyRes.profile_updates && Object.keys(journeyRes.profile_updates).length > 0) {
          systemMsgs.push({
            id: `system-profile-${Date.now()}`,
            role: "ai",
            content: "✅ Your profile has been updated with new information.",
          });
        }

        // If this was a new chat, persist messages and redirect to the actual session.
        if (sessionId === 'new' && journeyRes.session_id && typeof window !== 'undefined') {
          const key = getBootstrapKey(journeyRes.session_id);
          const boot = {
            isJourneyMode: true,
            selectedTool: null as FeatureKey,
            selectedDocumentType: null as DocumentType | 'analyze' | null,
            messages: [...messages, { id: localId, role: 'user', content: text, attachments: currentAttachments.length > 0 ? currentAttachments : undefined }, aiMsg, ...systemMsgs],
          };
          try {
            window.sessionStorage.setItem(key, JSON.stringify(boot));
          } catch (e) {
            console.error('Failed to persist chat bootstrap', e);
          }
          router.replace(`/new-dashboard/chat/${journeyRes.session_id}`);
          return;
        }

        setMessages(prev => [...prev, aiMsg, ...systemMsgs]);
      } else {
        // Standard document builder flow
        const currentSessionId = sessionId === 'new' ? undefined : sessionId;
        const res = await sendMessage({
          sessionId: currentSessionId,
          message: text,
          feature: effectiveTool === "document_builder" ? "document_builder" : "general",
          documentType: effectiveTool === "document_builder" && effectiveDocumentType !== 'analyze' ? effectiveDocumentType : undefined,
          attachmentIds: selectedFileIds,
          generateDraft: wantsGenerateDraft,
        });

        let draftKey: string | undefined;
        if (typeof window !== "undefined" && res.documentDraft && effectiveDocumentType !== 'analyze') {
          try {
            draftKey = `docbuilder-draft-${res.sessionId}-${Date.now()}`;
            window.localStorage.setItem(draftKey, JSON.stringify({ documentType: effectiveDocumentType, documentDraft: res.documentDraft }));
          } catch (e) {
            console.error("Failed to persist draft", e);
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
          documentType: effectiveDocumentType !== 'analyze' ? effectiveDocumentType as DocumentType : null,
          draftKey,
        };

        // If this was a new chat, persist messages and redirect so the new page renders instantly.
        if (sessionId === 'new' && res.sessionId && typeof window !== 'undefined') {
          const key = getBootstrapKey(res.sessionId);
          const boot = {
            isJourneyMode: false,
            selectedTool: effectiveTool,
            selectedDocumentType: effectiveDocumentType,
            messages: [...messages, { id: localId, role: 'user', content: text, attachments: currentAttachments.length > 0 ? currentAttachments : undefined }, aiMsg],
          };
          try {
            window.sessionStorage.setItem(key, JSON.stringify(boot));
          } catch (e) {
            console.error('Failed to persist chat bootstrap', e);
          }
          router.replace(`/new-dashboard/chat/${res.sessionId}`);
          return;
        }

        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "ai", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  }, [input, selectedTool, selectedDocumentType, sessionId, selectedFileIds, uploadedFiles, previousFiles, router, isJourneyMode, messages, getBootstrapKey]);

  // Check for pending message from dashboard (auto-send once on /chat/new)
  useEffect(() => {
    if (sessionId === 'new' && !pendingMessageProcessed && typeof window !== 'undefined') {
      const pendingStr = sessionStorage.getItem('pendingChatMessage');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.tool !== undefined) {
            setSelectedTool(pending.tool);
          }
          if (pending.documentType !== undefined) {
            setSelectedDocumentType(pending.documentType);
          }
          if (typeof pending.isJourneyContext === 'boolean') {
            setIsJourneyMode(pending.isJourneyContext);
          }
          if (pending.message) {
            onSend({
              text: pending.message,
              tool: pending.tool ?? null,
              documentType: pending.documentType ?? null,
              isJourney: !!pending.isJourneyContext,
            });
          }
          sessionStorage.removeItem('pendingChatMessage');
        } catch (e) {
          console.error("Failed to parse pending message", e);
        }
      }
      setPendingMessageProcessed(true);
    }
  }, [sessionId, pendingMessageProcessed, onSend]);

  if (isLoadingHistory) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <Link href="/new-dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isJourneyMode 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                : 'bg-gradient-to-br from-blue-600 to-violet-600'
            }`}>
              {isJourneyMode ? <Map size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
            </div>
            <span className="font-semibold text-gray-900">
              {isJourneyMode ? 'Journey Chat' : 'Chat'}
            </span>
            {isJourneyMode && (
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                Roadmap Mode
              </span>
            )}
          </div>
        </header>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%]`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    m.role === "user" 
                      ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm" 
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}>
                    {m.role === "user" ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : (
                      <MarkdownContent content={m.content} className="prose-sm" />
                    )}
                  </div>
                  
                  {/* Attachments */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((file, idx) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div key={`att-${m.id}-${idx}`} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">
                            <FileIcon size={14} className="text-gray-500" />
                            <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Progress */}
                  {m.progress && m.role === "ai" && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Progress</span>
                        <span className="text-xs font-bold text-blue-600">{Math.round(m.progress.percentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${Math.round(m.progress.percentage)}%` }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Draft link */}
                  {m.role === "ai" && m.documentDraft && m.draftKey && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs text-blue-900">
                        {m.savedDocId ? 'Document saved! Click to continue editing.' : 'Draft ready! Open in editor to fine-tune.'}
                      </span>
                      {m.documentType === "lor" ? (
                        <button 
                          onClick={() => handleOpenInEditor(m)}
                          disabled={savingDraftId === m.id}
                          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-1"
                        >
                          {savingDraftId === m.id && <Loader2 size={12} className="animate-spin" />}
                          {m.savedDocId ? 'Edit LOR' : 'Open LOR Editor'}
                        </button>
                      ) : m.documentType === "sop" ? (
                        <button 
                          onClick={() => handleOpenInEditor(m)}
                          disabled={savingDraftId === m.id}
                          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-1"
                        >
                          {savingDraftId === m.id && <Loader2 size={12} className="animate-spin" />}
                          {m.savedDocId ? 'Edit SOP' : 'Open SOP Editor'}
                        </button>
                      ) : m.documentType === "resume" ? (
                        <Link href={`/dashboard/document-builder/resume/editor-v2?draftKey=${encodeURIComponent(m.draftKey)}`} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700">
                          Open Resume Builder
                        </Link>
                      ) : m.documentType === "cv" ? (
                        <Link href={`/dashboard/document-builder/cv/editor-v2?draftKey=${encodeURIComponent(m.draftKey)}`} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700">
                          Open CV Builder
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
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
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            {/* Tool/Type Chips - Hidden in Journey Mode */}
            {!isJourneyMode && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              {selectedTool && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm">
                  <FileText size={14} className="text-blue-600" />
                  <span className="font-medium text-blue-900 text-xs">{agentTools.find(t => t.key === selectedTool)?.label}</span>
                  <button onClick={() => { setSelectedTool(null); setSelectedDocumentType(null); }} className="text-blue-400 hover:text-blue-700">
                    <X size={12} />
                  </button>
                </div>
              )}
              
              {selectedDocumentType && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-sm">
                  {(() => {
                    const Icon = documentTypeOptions.find(d => d.key === selectedDocumentType)?.icon;
                    return Icon ? <Icon size={14} className="text-purple-600" /> : null;
                  })()}
                  <span className="font-medium text-purple-900 text-xs">{documentTypeOptions.find(d => d.key === selectedDocumentType)?.label}</span>
                  <button onClick={() => setSelectedDocumentType(null)} className="text-purple-400 hover:text-purple-700">
                    <X size={12} />
                  </button>
                </div>
              )}
              
              {/* Document Type Dropdown */}
              {selectedTool === "document_builder" && (
                <div className="relative" ref={documentTypeDropdownRef}>
                  <button
                    onClick={() => setShowDocumentTypeDropdown(!showDocumentTypeDropdown)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
                  >
                    <ChevronDown size={12} className={`transition-transform ${showDocumentTypeDropdown ? 'rotate-180' : ''}`} />
                    <span>{selectedDocumentType ? 'Change' : 'Select type'}</span>
                  </button>
                  {showDocumentTypeDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px] z-30">
                      {documentTypeOptions.map((docType) => (
                        <button
                          key={docType.key}
                          onClick={() => { setSelectedDocumentType(docType.key); setShowDocumentTypeDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${selectedDocumentType === docType.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
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
            
            {/* File Chips - Hidden in Journey Mode */}
            {!isJourneyMode && (uploadedFiles.length > 0 || selectedFileIds.length > 0) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div key={`upload-${file.id}-${idx}`} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                      file.status === "uploading" ? "bg-blue-50 border-blue-200" :
                      file.status === "processing" ? "bg-amber-50 border-amber-200" :
                      file.status === "error" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                    }`}>
                      {file.status === "uploading" || file.status === "processing" ? <Loader2 size={12} className="animate-spin text-blue-500" /> :
                       file.status === "error" ? <AlertCircle size={12} className="text-red-500" /> : <FileIcon size={12} className="text-green-600" />}
                      <span className="max-w-[100px] truncate text-gray-700">{file.name}</span>
                      <button onClick={() => removeUploadedFile(file.id)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Input */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-2 p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
              {!isJourneyMode && (
                <>
                  <button onClick={() => setShowFilePanel(!showFilePanel)} data-file-trigger className="text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-white">
                    <Plus size={20} />
                  </button>
                  <button onClick={onUploadClick} className="text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-white">
                    <Paperclip size={20} />
                  </button>
                </>
              )}
              <textarea
                ref={chatInputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm resize-none"
                placeholder={placeholder}
                disabled={isSending}
              />
              <button onClick={() => alert("Voice input coming soon")} className="text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-white">
                <Mic size={20} />
              </button>
              <button
                onClick={() => onSend()}
                disabled={isSending || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-gray-200 disabled:to-gray-300 text-white rounded-xl px-4 py-2 flex items-center gap-2 font-medium disabled:cursor-not-allowed"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
            </div>
            
            {/* File Panel - Hidden in Journey Mode */}
            {!isJourneyMode && showFilePanel && selectedTool === "document_builder" && (
              <div ref={filePanelRef} className="mt-3 border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Your Files</span>
                  <button onClick={loadPreviousFiles} className="text-xs text-blue-600 hover:text-blue-700">Refresh</button>
                </div>
                {isLoadingFiles ? (
                  <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
                ) : previousFiles.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">No files uploaded yet.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {previousFiles.map((file, idx) => {
                      const FileIcon = getFileIcon(file.type);
                      const isSelected = selectedFileIds.includes(file.id);
                      return (
                        <button
                          key={`prev-${file.id}-${idx}`}
                          onClick={() => toggleFileSelection(file.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs border ${isSelected ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
                        >
                          <FileIcon size={16} className={isSelected ? "text-blue-500" : "text-gray-400"} />
                          <span className="truncate flex-1">{file.name}</span>
                          {isSelected && <Check size={14} className="text-blue-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * AI Chat Component
 * Two modes: Form mode (initial) and Chat mode (after generation)
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownContent } from '@/components/chat/MarkdownContent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, Wand2, Send, Paperclip } from 'lucide-react';
import { generateSOP, rewriteText } from '../lib/api';
import type { EditorHandle } from './Editor';
import UploadPanel from './UploadPanel';
import { normalizeEditorHtml, normalizeInlineHtml, jsonToHtmlWithMarkdown, ensureDocumentTitle, ensureEditorJsonTitle } from '../lib/markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  editorRef: React.RefObject<EditorHandle | null>;
  uploadedFileIds: string[];
  onGenerationStart?: () => void;
  onSOPGenerated?: () => void;
  onGeneratedContent?: (content: Record<string, unknown>) => void;
  isGenerating: boolean; // true = chat mode, false = form mode
}

export default function AIChat({
  editorRef,
  uploadedFileIds,
  onGenerationStart,
  onSOPGenerated,
  onGeneratedContent,
  isGenerating,
}: AIChatProps) {
  // Form state with localStorage persistence
  const [program, setProgram] = useState('');
  const [university, setUniversity] = useState('');
  const [background, setBackground] = useState('');
  const [goals, setGoals] = useState('');
  const [projectsSummary, setProjectsSummary] = useState('');
  const [aboutYou, setAboutYou] = useState('');
  const [others, setOthers] = useState('');
  const [tone, setTone] = useState('formal');
  const [wordLimit, setWordLimit] = useState(1000);

  // Load form values from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('sopFormData');
    if (savedFormData) {
      try {
        const data = JSON.parse(savedFormData);
        setProgram(data.program || '');
        setUniversity(data.university || '');
        setBackground(data.background || '');
        setGoals(data.goals || '');
        setProjectsSummary(data.projectsSummary || '');
        setAboutYou(data.aboutYou || '');
        setOthers(data.others || '');
        setTone(data.tone || 'formal');
        setWordLimit(data.wordLimit || 1000);
      } catch (e) {
        console.error('Failed to load saved form data', e);
      }
    }
  }, []);

  // Save form values to localStorage whenever they change
  useEffect(() => {
    const formData = {
      program,
      university,
      background,
      goals,
      projectsSummary,
      aboutYou,
      others,
      tone,
      wordLimit,
    };
    localStorage.setItem('sopFormData', JSON.stringify(formData));
  }, [program, university, background, goals, projectsSummary, aboutYou, others, tone, wordLimit]);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: 'Hi! I\'m your AI assistant. I can help you improve your SOP. You can:\n\n• Ask me to rewrite or improve specific sections\n• Request to change the tone or style\n• Add new information\n• Shorten or expand content\n\nHow can I help you today?',
    timestamp: new Date(),
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Capture and persist selection state from editor
  const [capturedSelection, setCapturedSelection] = useState<{
    text: string;
    range: { from: number; to: number } | null;
  } | null>(null);
  
  // Upload panel visibility in chat mode
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [chatUploadedFiles, setChatUploadedFiles] = useState<Array<{ file_id: string }>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Poll editor selection every 500ms to capture user selections before focus moves to chat
  useEffect(() => {
    if (!isGenerating) return; // Only track in chat mode
    const interval = setInterval(() => {
      const text = editorRef.current?.getSelectedText()?.trim() || '';
      const range = editorRef.current?.getSelectionRange();
      if (text && range) {
        setCapturedSelection({ text, range });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isGenerating, editorRef]);

  const handleGenerateSOP = async () => {
    if (!program || !background || !goals) {
      setError('Please fill in program, background, and goals');
      return;
    }

    onGenerationStart?.(); // Trigger loading phase
    setError(null);

    try {
      console.log('Starting SOP generation...');
      const response = await generateSOP({
        program,
        university: university || undefined,
        about_you: aboutYou || undefined,
        background,
        projects_summary: projectsSummary || undefined,
        goals,
        others: others || undefined,
        tone,
        word_limit: wordLimit,
        file_ids: uploadedFileIds,
      });

      console.log('SOP generated successfully:', response);
      
      // Set content in editor
      const derivedTitle = buildSopTitle(response.title, program, university);
      const jsonWithTitle = response.editor_json
        ? ensureEditorJsonTitle(response.editor_json as Record<string, unknown>, derivedTitle, {
            fontFamily: '"Times New Roman", serif',
            fontSize: '12pt',
            textAlign: 'center',
            lineHeight: '1.5',
          })
        : null;

      if (jsonWithTitle) {
        onGeneratedContent?.(jsonWithTitle);
      } else if (response.editor_json) {
        onGeneratedContent?.(response.editor_json as Record<string, unknown>);
      }

      const htmlFromJson = jsonWithTitle
        ? jsonToHtmlWithMarkdown(jsonWithTitle)
        : response.editor_json
          ? jsonToHtmlWithMarkdown(response.editor_json as Record<string, unknown>)
          : '';

      const htmlSource = [response.html, htmlFromJson].find((value) => value && value.trim().length > 0) || '';

      if (htmlSource) {
        const normalizedHtml = normalizeEditorHtml(htmlSource);
        const htmlWithTitle = ensureDocumentTitle(normalizedHtml, derivedTitle);
        editorRef.current?.setContent(htmlWithTitle);
      } else {
        console.error('No content in SOP response');
      }
      
      onSOPGenerated?.(); // Show split view with chat mode
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      // Don't call onSOPGenerated on error - stay on form
    }
  };

  const handleClearSelection = () => {
    setCapturedSelection(null);
  };
  
  const handleChatFilesChange = (files: Array<{ file_id: string }>) => {
    // Store files uploaded in chat mode
    setChatUploadedFiles(files);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    // Use captured selection if available, otherwise try to get current selection
    const selected = capturedSelection?.text || editorRef.current?.getSelectedText()?.trim() || '';
    const range = capturedSelection?.range || editorRef.current?.getSelectionRange();
    
    // If no selection, use whole document for overall changes
    const useWholeDoc = !selected;
    const contentToEdit = useWholeDoc ? editorRef.current?.getHTML() || '' : selected;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Merge initial uploaded files with any files added during chat
      const allFileIds = [...uploadedFileIds, ...chatUploadedFiles.map(f => f.file_id)];
      
      // Call rewrite endpoint with selected text or whole document
      const response = await rewriteText({
        selected_text: contentToEdit,
        instruction: inputMessage,
        program: program || undefined,
        university: university || undefined,
        file_ids: allFileIds.length > 0 ? allFileIds : undefined,
      });

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'ve updated your SOP in the editor. The changes have been applied based on your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      const rewrittenRaw = response.rewritten_text || '';
      const inlineHtml = normalizeInlineHtml(rewrittenRaw) || rewrittenRaw;
      const documentHtml = normalizeEditorHtml(rewrittenRaw) || inlineHtml;

      if (useWholeDoc) {
        editorRef.current?.setContent(documentHtml);
        setCapturedSelection(null);
      } else if (range) {
        editorRef.current?.replaceSelectionAt(range, inlineHtml);
        setCapturedSelection(null);
      } else {
        editorRef.current?.replaceSelection(inlineHtml);
        setCapturedSelection(null);
      }

      // Word count guidance: notify if rewritten length deviates too much (only for selections, not whole doc)
      if (!useWholeDoc) {
        const count = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
        const prevWords = count(selected);
        const newWords = count(response.rewritten_text || '');
        if (prevWords > 0) {
        const delta = newWords - prevWords;
        const pct = Math.abs(delta) / prevWords;
        if (pct > 0.15) {
          const direction = delta > 0 ? 'longer' : 'shorter';
          const suggestion = delta > 0 ? 'shorten' : 'expand';
          const advisory: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `Note: The rewritten text is ${direction} (${newWords} vs ${prevWords} words). If you'd like, ask me to \"${suggestion}\" it to better match the original length.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, advisory]);
        }
      }
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  // Chat Mode - After generation
  if (isGenerating) {
    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="border-b p-4 bg-white">
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-xs text-gray-500">Ask me to improve your SOP</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <MarkdownContent content={message.content} className="text-sm" />
                )}
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white">
          {/* Upload Panel (collapsible in chat mode) */}
          {showUploadPanel && (
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Upload Additional Documents
                  {(uploadedFileIds.length + chatUploadedFiles.length) > 0 && (
                    <span className="ml-2 text-xs text-blue-600">
                      ({uploadedFileIds.length + chatUploadedFiles.length} file{(uploadedFileIds.length + chatUploadedFiles.length) !== 1 ? 's' : ''} uploaded)
                    </span>
                  )}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadPanel(false)}
                >
                  Close
                </Button>
              </div>
              <UploadPanel onFilesChange={handleChatFilesChange} />
            </div>
          )}
          
          <div className="p-4">
          {capturedSelection?.text && (
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">
                  {capturedSelection.text.length > 60 
                    ? `${capturedSelection.text.substring(0, 60)}...` 
                    : capturedSelection.text}
                </span>
                <span className="ml-auto text-xs text-blue-600">
                  ({capturedSelection.text.split(/\s+/).filter(Boolean).length} words selected)
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClearSelection();
                  }}
                  className="ml-2 p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                  title="Clear selection"
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={capturedSelection ? "Tell me how to improve this selection..." : "Ask me to improve the whole SOP, or select specific text to edit..."}
              className="min-h-[60px] resize-none"
              disabled={loading}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                title="Upload additional documents"
                className={showUploadPanel ? 'bg-blue-50 border-blue-300' : ''}
              >
                <div className="relative">
                  <Paperclip className="h-4 w-4" />
                  {(uploadedFileIds.length + chatUploadedFiles.length) > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full text-white text-[8px] flex items-center justify-center">
                      {uploadedFileIds.length + chatUploadedFiles.length}
                    </span>
                  )}
                </div>
              </Button>
              <Button
                size="icon"
                onClick={() => void handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Form Mode - Initial input
  return (
    <Card className="p-8 shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">SOP Generator</h2>
        <p className="text-base text-gray-600">
          Fill in the details below and upload supporting documents to generate your
          Statement of Purpose
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
          <div>
            <Label htmlFor="program" className="text-base font-medium">
              Program Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="e.g., MS Computer Science"
              className="mt-2 h-11 text-base"
            />
          </div>

          <div>
            <Label htmlFor="university" className="text-base font-medium">Target University</Label>
            <Input
              id="university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g., Stanford University"
              className="mt-2 h-11 text-base"
            />
          </div>
        </div>

        {/* Personal & Background Section */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Story</h3>
          <div>
            <Label htmlFor="aboutYou" className="text-base font-medium">About You</Label>
            <Textarea
              id="aboutYou"
              value={aboutYou}
              onChange={(e) => setAboutYou(e.target.value)}
              placeholder="Tell us about yourself, your interests, and motivations..."
              rows={4}
              className="mt-2 text-base"
            />
          </div>

          <div>
            <Label htmlFor="background" className="text-base font-medium">
              Academic/Professional Background <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="background"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Describe your educational background and work experience..."
              rows={4}
              className="mt-2 text-base"
            />
          </div>
        </div>

        {/* Achievements & Goals Section */}
        <div className="space-y-4 pb-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Achievements & Goals</h3>
          <div>
            <Label htmlFor="projects" className="text-base font-medium">Projects Summary</Label>
            <Textarea
              id="projects"
              value={projectsSummary}
              onChange={(e) => setProjectsSummary(e.target.value)}
              placeholder="Highlight key projects, research work, and technical achievements..."
              rows={4}
              className="mt-2 text-base"
            />
          </div>

          <div>
            <Label htmlFor="goals" className="text-base font-medium">
              Career & Academic Goals <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Describe your short-term and long-term goals..."
              rows={4}
              className="mt-2 text-base"
            />
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Details</h3>
          <div>
            <Label htmlFor="others" className="text-base font-medium">Others (Optional)</Label>
            <Textarea
              id="others"
              value={others}
              onChange={(e) => setOthers(e.target.value)}
              placeholder="Any additional information you'd like to include..."
              rows={3}
              className="mt-2 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tone" className="text-base font-medium">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone" className="mt-2 h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="wordLimit" className="text-base font-medium">Word Limit</Label>
              <Input
                id="wordLimit"
                type="number"
                value={wordLimit}
                onChange={(e) => setWordLimit(parseInt(e.target.value) || 1000)}
                min={500}
                max={2000}
                className="mt-2 h-11 text-base"
              />
            </div>
          </div>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          onClick={() => void handleGenerateSOP()}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Generating Your SOP...
            </>
          ) : (
            <>
              <Wand2 className="mr-3 h-5 w-5" />
              Generate SOP
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function buildSopTitle(responseTitle: string | undefined, program: string, university: string): string {
  if (responseTitle?.trim()) return responseTitle.trim();
  if (program && university) {
    return `Statement of Purpose - ${program} at ${university}`;
  }
  if (program) {
    return `Statement of Purpose - ${program}`;
  }
  return 'Statement of Purpose';
}

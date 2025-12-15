/**
 * AIChatLOR Component
 * Mirrors SOP AIChat but for Letter of Recommendation generation & rewrite.
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Wand2, Send } from 'lucide-react';
import { generateLOR, rewriteText } from '../../sop-generator/lib/api';
import type { EditorHandle } from '../../sop-generator/components/Editor';
import UploadPanel from '../../sop-generator/components/UploadPanel';
import { normalizeEditorHtml, normalizeInlineHtml, jsonToHtmlWithMarkdown, ensureDocumentTitle, ensureEditorJsonTitle } from '../../sop-generator/lib/markdown';
import { MarkdownContent } from '@/components/chat/MarkdownContent';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }

interface AIChatLORProps {
  editorRef: React.RefObject<EditorHandle | null>;
  evidenceFileIds: string[];
  onGenerationStart?: () => void;
  onGenerated?: () => void;
  onGeneratedContent?: (content: Record<string, unknown>) => void;
  isChatMode: boolean;
  targetProgram?: string;
  targetUniversity?: string;
}

export default function AIChatLOR({
  editorRef,
  evidenceFileIds,
  onGenerationStart,
  onGenerated,
  onGeneratedContent,
  isChatMode,
  targetProgram,
  targetUniversity
}: AIChatLORProps) {
  // Form state
  const [recommenderName, setRecommenderName] = useState('');
  const [recommenderTitle, setRecommenderTitle] = useState('');
  const [recommenderRelationship, setRecommenderRelationship] = useState('');
  const [recommenderDuration, setRecommenderDuration] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRole, setStudentRole] = useState('');
  const [studentUnderDuration, setStudentUnderDuration] = useState('');
  const [skillsObserved, setSkillsObserved] = useState('');
  const [achievements, setAchievements] = useState('');
  const [characterTraits, setCharacterTraits] = useState('');
  const [program, setProgram] = useState('');
  const [university, setUniversity] = useState('');
  const [country, setCountry] = useState('');
  const [tone, setTone] = useState('academic');
  const [strength, setStrength] = useState('strongly recommended');
  const [wordLimit, setWordLimit] = useState(800);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: 'Hi! I can help refine or adjust your LOR. Select text in the editor and instruct me (e.g., "make more concise", "emphasize leadership").',
    timestamp: new Date(),
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [capturedSelection, setCapturedSelection] = useState<{ text: string; range: { from: number; to: number } | null } | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!isChatMode) return;
    const interval = setInterval(() => {
      const text = editorRef.current?.getSelectedText()?.trim() || '';
      const range = editorRef.current?.getSelectionRange();
      if (text && range) setCapturedSelection({ text, range });
    }, 500);
    return () => clearInterval(interval);
  }, [isChatMode, editorRef]);

  const handleGenerate = async () => {
    if (!recommenderName || !studentName || !program) return;
    onGenerationStart?.();
    const evidenceIds = (evidenceFileIds || []).filter(Boolean).map(String).filter(id => id.trim().length > 0);
    try {
      const payload = {
        recommender_name: recommenderName,
        recommender_title: recommenderTitle,
        recommender_relationship: recommenderRelationship,
        recommender_association_duration: recommenderDuration,
        student_name: studentName,
        student_role: studentRole || undefined,
        student_under_duration: studentUnderDuration || undefined,
        skills_observed: skillsObserved || undefined,
        achievements: achievements || undefined,
        character_traits: characterTraits || undefined,
        target_program: program,
        target_university: university || undefined,
        target_country: country || undefined,
        tone,
        recommendation_strength: strength,
        word_limit: wordLimit,
        evidence_file_ids: evidenceIds,
        cv_file_ids: [],
        transcript_file_ids: [],
      };
      const response = await generateLOR(payload);
      const derivedTitle = buildLorTitle(response.title, studentName, program, university);
      const jsonWithTitle = response.editor_json
        ? ensureEditorJsonTitle(response.editor_json as Record<string, unknown>, derivedTitle, {
            fontFamily: '"Times New Roman", serif',
            fontSize: '12pt',
            textAlign: 'left',
            lineHeight: '1.5',
          })
        : null;

      if (jsonWithTitle) {
        onGeneratedContent?.(jsonWithTitle);
      } else if (response.editor_json) {
        onGeneratedContent?.(response.editor_json as Record<string, unknown>);
      }

      const fallbackHtml = jsonWithTitle
        ? jsonToHtmlWithMarkdown(jsonWithTitle)
        : response.editor_json
          ? jsonToHtmlWithMarkdown(response.editor_json as Record<string, unknown>)
          : '';

      const htmlSource = response.html && response.html.trim().length > 0
        ? response.html
        : fallbackHtml;
      if (htmlSource) {
        const normalized = normalizeEditorHtml(htmlSource);
        const withTitle = ensureDocumentTitle(normalized, derivedTitle);
        editorRef.current?.setContent(withTitle);
      }
      onGenerated?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('LOR generation failed', msg);
      if (msg.includes("'file_id'")) {
        try {
          const fallback = await generateLOR({
            recommender_name: recommenderName,
            recommender_title: recommenderTitle,
            recommender_relationship: recommenderRelationship,
            recommender_association_duration: recommenderDuration,
            student_name: studentName,
            student_role: studentRole || undefined,
            student_under_duration: studentUnderDuration || undefined,
            skills_observed: skillsObserved || undefined,
            achievements: achievements || undefined,
            character_traits: characterTraits || undefined,
            target_program: program,
            target_university: university || undefined,
            target_country: country || undefined,
            tone,
            recommendation_strength: strength,
            word_limit: wordLimit,
            evidence_file_ids: [] as string[], cv_file_ids: [] as string[], transcript_file_ids: [] as string[],
          });
          const derivedFallbackTitle = buildLorTitle(fallback.title, studentName, program, university);
          const fallbackJsonWithTitle = fallback.editor_json
            ? ensureEditorJsonTitle(fallback.editor_json as Record<string, unknown>, derivedFallbackTitle, {
                fontFamily: '"Times New Roman", serif',
                fontSize: '12pt',
                textAlign: 'left',
                lineHeight: '1.5',
              })
            : null;

          if (fallbackJsonWithTitle) {
            onGeneratedContent?.(fallbackJsonWithTitle);
          } else if (fallback.editor_json) {
            onGeneratedContent?.(fallback.editor_json as Record<string, unknown>);
          }

          const fallbackHtmlString = fallbackJsonWithTitle
            ? jsonToHtmlWithMarkdown(fallbackJsonWithTitle)
            : fallback.editor_json
              ? jsonToHtmlWithMarkdown(fallback.editor_json as Record<string, unknown>)
              : '';
          const htmlSource = fallback.html && fallback.html.trim().length > 0
            ? fallback.html
            : fallbackHtmlString;
          if (htmlSource) {
            const normalized = normalizeEditorHtml(htmlSource);
            const withTitle = ensureDocumentTitle(normalized, derivedFallbackTitle);
            editorRef.current?.setContent(withTitle);
          }
          onGenerated?.();
          return;
        } catch (e2) {
          console.error('Fallback LOR generation failed', e2);
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
    const selected = capturedSelection?.text || editorRef.current?.getSelectedText()?.trim() || '';
    const range = capturedSelection?.range || editorRef.current?.getSelectionRange();
    const useWholeDoc = !selected;
    const contentToEdit = useWholeDoc ? (editorRef.current?.getHTML() || '') : selected;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    try {
      const response = await rewriteText({
        selected_text: contentToEdit,
        instruction: userMessage.content,
        program: program || undefined,
        university: university || undefined,
      });
      const rewrittenRaw = response.rewritten_text || '';
      const inlineHtml = normalizeInlineHtml(rewrittenRaw) || rewrittenRaw;
      const docHtml = ensureDocumentTitle(normalizeEditorHtml(rewrittenRaw) || inlineHtml, buildLorTitle(undefined, studentName, program, university));

      if (useWholeDoc) {
        editorRef.current?.setContent(docHtml);
        setCapturedSelection(null);
      } else if (range) {
        editorRef.current?.replaceSelectionAt(range, inlineHtml);
        setCapturedSelection(null);
      } else {
        editorRef.current?.replaceSelection(inlineHtml);
        setCapturedSelection(null);
      }
      const aiMessage: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: 'Update applied.', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      console.error('Rewrite failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isChatMode) {
    return (
      <div className="space-y-6">
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wand2 className="h-5 w-5"/>Generate LOR</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input placeholder="Recommender Name" value={recommenderName} onChange={e=>setRecommenderName(e.target.value)} />
            <Input placeholder="Recommender Title/Organization" value={recommenderTitle} onChange={e=>setRecommenderTitle(e.target.value)} />
            <Input placeholder="Relationship (Professor / Manager)" value={recommenderRelationship} onChange={e=>setRecommenderRelationship(e.target.value)} />
            <Input placeholder="Association Duration" value={recommenderDuration} onChange={e=>setRecommenderDuration(e.target.value)} />
            <Input placeholder="Student Name" value={studentName} onChange={e=>setStudentName(e.target.value)} />
            <Input placeholder="Student Degree / Role" value={studentRole} onChange={e=>setStudentRole(e.target.value)} />
            <Input placeholder="Duration under recommender" value={studentUnderDuration} onChange={e=>setStudentUnderDuration(e.target.value)} />
            <Input placeholder="Program" value={program} onChange={e=>setProgram(e.target.value)} />
            <Input placeholder="University" value={university} onChange={e=>setUniversity(e.target.value)} />
            <Input placeholder="Country" value={country} onChange={e=>setCountry(e.target.value)} />
            <Input placeholder="Tone (academic/managerial/balanced)" value={tone} onChange={e=>setTone(e.target.value)} />
            <Input placeholder="Strength (recommended/strongly recommended/highly recommended)" value={strength} onChange={e=>setStrength(e.target.value)} />
            <Input type="number" placeholder="Word Limit" value={wordLimit} onChange={e=>setWordLimit(parseInt(e.target.value)||800)} />
          </div>
          <Textarea placeholder="Skills Observed" value={skillsObserved} onChange={e=>setSkillsObserved(e.target.value)} />
          <Textarea placeholder="Achievements / Examples" value={achievements} onChange={e=>setAchievements(e.target.value)} />
          <Textarea placeholder="Character Traits" value={characterTraits} onChange={e=>setCharacterTraits(e.target.value)} />
          <div>
            <UploadPanel onFilesChange={() => { /* handled upstream via evidenceFileIds */ }} />
          </div>
          <Button disabled={!recommenderName || !studentName || !program} onClick={handleGenerate}>Generate Letter</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI Writing Assistant
        </h3>
        <p className="text-xs text-gray-500 mt-1">Select text in the editor to refine specific sections</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
              m.role === 'assistant' 
                ? 'bg-white border border-gray-200 text-gray-800' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
            }`}>
              <div className="flex items-start gap-2">
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                )}
                <div className="flex-1">
                  {m.role === 'assistant' ? (
                    <MarkdownContent content={m.content} className="text-sm" />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 shadow-lg">
        {capturedSelection && (
          <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <span className="font-medium">✓ Text selected:</span> {capturedSelection.text.substring(0, 50)}...
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={e=>setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={capturedSelection ? 'How would you like to modify the selected text?' : 'Type your instruction... (will apply to whole letter)'}
            className="flex-1 min-h-[80px] resize-none text-sm"
          />
          <Button 
            disabled={loading || !inputMessage.trim()} 
            onClick={handleSendMessage}
            className="h-[80px] px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin"/>
            ) : (
              <Send className="h-5 w-5"/>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function buildLorTitle(responseTitle: string | undefined, studentName: string, program: string, university: string): string {
  if (responseTitle?.trim()) return responseTitle.trim();
  if (studentName && program && university) {
    return `Letter of Recommendation for ${studentName} - ${program} at ${university}`;
  }
  if (studentName && program) {
    return `Letter of Recommendation for ${studentName} - ${program}`;
  }
  if (studentName) {
    return `Letter of Recommendation for ${studentName}`;
  }
  return 'Letter of Recommendation';
}

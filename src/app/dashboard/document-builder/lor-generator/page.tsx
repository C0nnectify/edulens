/**
 * LOR Generator Page (Letter of Recommendation)
 * Reuses SOP editor + download logic with adjusted form fields.
 */
'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Editor, { EditorHandle } from '../sop-generator/components/Editor';
import UploadPanel from '../sop-generator/components/UploadPanel';
import { generateLOR, saveSOP, listLORs, getSOP, deleteSOP } from '../sop-generator/lib/api';
import AIChatLOR from './components/AIChatLOR';
import { downloadEditorPdf } from '../sop-generator/lib/pdfExport';
import { Download, Save, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { jsonToHtmlWithMarkdown, normalizeEditorHtml } from '../sop-generator/lib/markdown';

export default function LORGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdFromUrl = searchParams?.get('id');
  const draftKeyFromUrl = searchParams?.get('draftKey');
  const editorRef = useRef<EditorHandle>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedEvidenceIds, setUploadedEvidenceIds] = useState<string[]>([]);
  // CV & transcript placeholders (not yet collected in UI)
  const uploadedCvIds: string[] = [];
  const uploadedTranscriptIds: string[] = [];

  // Form fields
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
  const [targetProgram, setTargetProgram] = useState('');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [tone, setTone] = useState('academic');
  const [strength, setStrength] = useState('strongly recommended');
  const [wordLimit, setWordLimit] = useState(800);

  const [lorId, setLorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [existingLORs, setExistingLORs] = useState<{ id: string; title: string; created_at: string; updated_at: string }[]>([]);
  const [activeLORId, setActiveLORId] = useState<string | null>(null);
  const [initialEditorContent, setInitialEditorContent] = useState<Record<string, unknown> | null>(null);

  const handleEvidenceChange = (files: Array<{ file_id: string }>) => {
    setUploadedEvidenceIds(files.map(f => f.file_id));
  };

  const handleGenerateLOR = async () => {
    if (!recommenderName || !studentName || !targetProgram) return;
    setIsGenerating(true);
    const evidenceIds = (uploadedEvidenceIds || []).filter(Boolean).map(String).filter(id => id.trim().length > 0);
    try {
      const basePayload = {
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
        target_program: targetProgram,
        target_university: targetUniversity || undefined,
        target_country: targetCountry || undefined,
        tone,
        recommendation_strength: strength,
        word_limit: wordLimit,
        evidence_file_ids: evidenceIds,
        cv_file_ids: uploadedCvIds,
        transcript_file_ids: uploadedTranscriptIds,
      } as const;
      const response = await generateLOR(basePayload);
      if (response.editor_json) {
        setInitialEditorContent(response.editor_json as Record<string, unknown>);
      }
      const fallbackHtml = response.editor_json
        ? jsonToHtmlWithMarkdown(response.editor_json as Record<string, unknown>)
        : '';
      const htmlSource = response.html && response.html.trim().length > 0
        ? response.html
        : fallbackHtml;
      if (htmlSource) {
        editorRef.current?.setContent(normalizeEditorHtml(htmlSource));
      }
      setHasGenerated(true);
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
            target_program: targetProgram,
            target_university: targetUniversity || undefined,
            target_country: targetCountry || undefined,
            tone,
            recommendation_strength: strength,
            word_limit: wordLimit,
            evidence_file_ids: [] as string[],
            cv_file_ids: [] as string[],
            transcript_file_ids: [] as string[],
          });
          if (fallback.editor_json) {
            setInitialEditorContent(fallback.editor_json as Record<string, unknown>);
          }
          const fallbackHtml = fallback.editor_json
            ? jsonToHtmlWithMarkdown(fallback.editor_json as Record<string, unknown>)
            : '';
          const htmlSource = fallback.html && fallback.html.trim().length > 0
            ? fallback.html
            : fallbackHtml;
          if (htmlSource) {
            editorRef.current?.setContent(normalizeEditorHtml(htmlSource));
          }
          setHasGenerated(true);
          return;
        } catch (e2) {
          console.error('Fallback LOR generation failed', e2);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    await downloadEditorPdf(editorRef, `letter-of-recommendation-${studentName || 'draft'}.pdf`);
  };

  const handleDelete = async () => {
    if (!lorId) return;
    const ok = window.confirm('Delete this LOR? This action cannot be undone.');
    if (!ok) return;
    try {
      await deleteSOP(lorId);
      const summaries = await listLORs(20);
      setExistingLORs(summaries);
      setLorId(null);
      setActiveLORId(null);
      setHasGenerated(false);
      setHasAutoSaved(false);
      setSaveMessage('Deleted');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (e) {
      console.error('Failed to delete LOR', e);
      setSaveMessage(e instanceof Error ? e.message : 'Delete failed');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const editorJson = editorRef.current?.getJSON();
      const html = editorRef.current?.getHTML() || '';
      if (!editorJson) throw new Error('No content');
      const response = await saveSOP({
        sop_id: lorId || undefined,
        title: `LOR for ${studentName}`,
        editor_json: editorJson,
        html,
        metadata: { doc_type: 'lor', student_name: studentName },
      });
      setLorId(response.sop_id);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (e) {
      console.error(e);
      setSaveMessage('Save failed');
      setTimeout(() => setSaveMessage(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save once after initial generation if not manually saved yet
  useEffect(() => {
    const doAutoSave = async () => {
      try {
        if (!hasGenerated || hasAutoSaved || lorId) return;
        const editorJson = editorRef.current?.getJSON();
        const html = editorRef.current?.getHTML() || '';
        if (!editorJson) return;
        const response = await saveSOP({
          sop_id: undefined,
          title: `LOR for ${studentName || 'Student'}`,
          editor_json: editorJson,
          html,
          metadata: { doc_type: 'lor', student_name: studentName },
        });
        setLorId(response.sop_id);
        setHasAutoSaved(true);
        setSaveMessage('Auto-saved');
        setTimeout(() => setSaveMessage(null), 2500);
      } catch (e) {
        console.error('Auto-save LOR failed', e);
      }
    };
    void doAutoSave();
  }, [hasGenerated, hasAutoSaved, lorId, studentName]);

  // Load existing LORs; only auto-load if ID or draftKey is in URL
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await listLORs(20);
        if (!mounted) return;
        setExistingLORs(items);
        
        // Only load document if ID or draftKey is explicitly provided in URL
        if (!hasGenerated) {
          if (docIdFromUrl) {
            const doc = await getSOP(docIdFromUrl);
            if (!mounted) return;
            if (doc.editor_json) {
              setInitialEditorContent(doc.editor_json as Record<string, unknown>);
            }
            const fallbackHtml = doc.editor_json
              ? jsonToHtmlWithMarkdown(doc.editor_json as Record<string, unknown>)
              : '';
            const htmlSource = doc.html && doc.html.trim().length > 0
              ? doc.html
              : fallbackHtml;
            if (htmlSource) {
              editorRef.current?.setContent(normalizeEditorHtml(htmlSource));
            }
            setLorId(doc.id);
            setActiveLORId(doc.id);
            setHasGenerated(true);
          } else if (draftKeyFromUrl && typeof window !== 'undefined') {
            // If a draftKey is provided (from Document Builder chat), load draft
            // content from localStorage and initialize the editor with it.
            try {
              const stored = window.localStorage.getItem(draftKeyFromUrl);
              if (stored) {
                const parsed = JSON.parse(stored) as {
                  documentType?: string | null;
                  documentDraft?: { editor_json?: Record<string, unknown>; html?: string };
                };
                if (!parsed.documentType || parsed.documentType === 'lor') {
                  const draft = parsed.documentDraft || (parsed as unknown as { editor_json?: Record<string, unknown> });
                  if (draft && draft.editor_json) {
                    setInitialEditorContent(draft.editor_json as Record<string, unknown>);
                    const fallbackHtml = jsonToHtmlWithMarkdown(draft.editor_json as Record<string, unknown>);
                    const htmlSource = draft.html && draft.html.trim().length > 0
                      ? draft.html
                      : fallbackHtml;
                    if (htmlSource) {
                      editorRef.current?.setContent(normalizeEditorHtml(htmlSource));
                    }
                    setLorId(null);
                    setActiveLORId(null);
                    setHasGenerated(true);
                  }
                }
              }
            } catch (err) {
              console.error('Failed to load LOR draft from localStorage', err);
            }
          }
        }
        // Otherwise, show the create form (don't auto-load)
      } catch (e) {
        console.error('Failed to list LORs', e);
      }
    })();
    return () => { mounted = false; };
  }, [hasGenerated, docIdFromUrl]);

  const handleSelectExisting = async (id: string) => {
    try {
      const doc = await getSOP(id);
      if (doc.editor_json) {
        setInitialEditorContent(doc.editor_json as Record<string, unknown>);
      }
      const fallbackHtml = doc.editor_json
        ? jsonToHtmlWithMarkdown(doc.editor_json as Record<string, unknown>)
        : '';
      const htmlSource = doc.html && doc.html.trim().length > 0
        ? doc.html
        : fallbackHtml;
      if (htmlSource) {
        editorRef.current?.setContent(normalizeEditorHtml(htmlSource));
      }
      setLorId(doc.id);
      setActiveLORId(doc.id);
      setHasGenerated(true);
    } catch (e) {
      console.error('Failed to load LOR', e);
    }
  };

  return (
    <DashboardLayout>
      {!hasGenerated ? (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI LOR Generator</h1>
            <p className="text-lg text-gray-600">Generate professional Letters of Recommendation with structured evidence.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Section 1: Recommender Details */}
              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">1</div>
                  <h2 className="text-xl font-semibold text-gray-800">Recommender Details</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Name</label>
                    <Input placeholder="Enter recommender's full name" value={recommenderName} onChange={e=>setRecommenderName(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Designation & Organization</label>
                    <Input placeholder="e.g., Professor, Computer Science Department" value={recommenderTitle} onChange={e=>setRecommenderTitle(e.target.value)} className="h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Relationship</label>
                      <Input placeholder="Professor / Manager" value={recommenderRelationship} onChange={e=>setRecommenderRelationship(e.target.value)} className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Duration</label>
                      <Input placeholder="e.g., 2 years" value={recommenderDuration} onChange={e=>setRecommenderDuration(e.target.value)} className="h-11" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section 2: Student Details */}
              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">2</div>
                  <h2 className="text-xl font-semibold text-gray-800">Student Details</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Student Name</label>
                    <Input placeholder="Enter student's full name" value={studentName} onChange={e=>setStudentName(e.target.value)} className="h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Degree / Role</label>
                      <Input placeholder="e.g., B.S. Computer Science" value={studentRole} onChange={e=>setStudentRole(e.target.value)} className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Duration</label>
                      <Input placeholder="e.g., 1 year" value={studentUnderDuration} onChange={e=>setStudentUnderDuration(e.target.value)} className="h-11" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section 3-5: Text Areas */}
              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">3</div>
                  <h2 className="text-xl font-semibold text-gray-800">Skills Observed</h2>
                </div>
                <Textarea 
                  placeholder="List key skills you've observed (e.g., analytical thinking, leadership, technical proficiency)" 
                  value={skillsObserved} 
                  onChange={e=>setSkillsObserved(e.target.value)} 
                  className="min-h-[100px] resize-none"
                />
              </Card>

              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">4</div>
                  <h2 className="text-xl font-semibold text-gray-800">Achievements / Examples</h2>
                </div>
                <Textarea 
                  placeholder="Provide specific examples and achievements that demonstrate the student's capabilities" 
                  value={achievements} 
                  onChange={e=>setAchievements(e.target.value)} 
                  className="min-h-[120px] resize-none"
                />
              </Card>

              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-semibold">5</div>
                  <h2 className="text-xl font-semibold text-gray-800">Character Traits</h2>
                </div>
                <Textarea 
                  placeholder="Describe personal qualities and character traits (e.g., dedicated, collaborative, innovative)" 
                  value={characterTraits} 
                  onChange={e=>setCharacterTraits(e.target.value)} 
                  className="min-h-[100px] resize-none"
                />
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Section 6: Target Program */}
              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">6</div>
                  <h2 className="text-xl font-semibold text-gray-800">Target Program</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Program Name</label>
                    <Input placeholder="e.g., M.S. in Computer Science" value={targetProgram} onChange={e=>setTargetProgram(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">University</label>
                    <Input placeholder="e.g., Stanford University" value={targetUniversity} onChange={e=>setTargetUniversity(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Country</label>
                    <Input placeholder="e.g., United States" value={targetCountry} onChange={e=>setTargetCountry(e.target.value)} className="h-11" />
                  </div>
                </div>
              </Card>

              {/* Section 7: Tone & Strength */}
              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold">7</div>
                  <h2 className="text-xl font-semibold text-gray-800">Tone & Strength</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tone</label>
                    <select className="w-full h-11 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={tone} onChange={e=>setTone(e.target.value)}>
                      <option value="academic">Academic</option>
                      <option value="managerial">Managerial</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Recommendation Strength</label>
                    <select className="w-full h-11 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={strength} onChange={e=>setStrength(e.target.value)}>
                      <option value="recommended">Recommended</option>
                      <option value="strongly recommended">Strongly Recommended</option>
                      <option value="highly recommended">Highly Recommended</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Word Limit</label>
                    <Input type="number" placeholder="800" value={wordLimit} onChange={e=>setWordLimit(parseInt(e.target.value)||800)} className="h-11" />
                  </div>
                </div>
              </Card>

              {/* Section 8: Evidence Upload */}
              <Card className="p-6 space-y-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold">8</div>
                  <h2 className="text-xl font-semibold text-gray-800">Evidence / Supporting Docs</h2>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Upload CV/Resume</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">📄</div>
                      <div className="text-sm text-gray-600">Drag and drop or <span className="text-blue-600 font-medium">browse files</span></div>
                      <div className="text-xs text-gray-500">PDF, DOCX, TXT</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 pt-2">Transcripts / Marksheets</p>
                  <UploadPanel onFilesChange={handleEvidenceChange} />
                </div>
              </Card>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleGenerateLOR} 
              disabled={isGenerating || !recommenderName || !studentName || !targetProgram}
              size="lg"
              className="w-full max-w-md h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate Letter of Recommendation</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-4rem)]">
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Navigate back to AI Document Builder landing page
                  router.push('/dashboard/document-builder');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
              <div>
                <h2 className="text-lg font-semibold">Letter of Recommendation</h2>
                <p className="text-xs text-gray-500">AI-powered editor</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {existingLORs.length > 0 && (
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={activeLORId || ''}
                  onChange={(e) => handleSelectExisting(e.target.value)}
                >
                  <option value="" disabled>My LORs</option>
                  {existingLORs.map(l => (
                    <option key={l.id} value={l.id}>{l.title || 'Untitled'}</option>
                  ))}
                </select>
              )}
              {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
              <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/>Download</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4"/>{saving? 'Saving...' : 'Save'}</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={!lorId}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
            </div>
          </div>
          <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-4rem)]">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full overflow-hidden bg-gray-50">
                <AIChatLOR
                  editorRef={editorRef}
                  evidenceFileIds={uploadedEvidenceIds}
                  onGenerationStart={()=>{/* already generated */}}
                  onGenerated={()=>{/* no-op */}}
                  onGeneratedContent={()=>{/* no-op */}}
                  isChatMode={true}
                  targetProgram={targetProgram}
                  targetUniversity={targetUniversity}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="h-full overflow-auto bg-white"><Editor ref={editorRef} initialContent={initialEditorContent || undefined} /></div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </DashboardLayout>
  );
}

// Basic utility styles (could be replaced with existing UI components)
// Removed unused style helper constants

// apply temporary class names via global CSS or Tailwind utilities if available
// Keeping inline strings for minimal footprint
//# sourceMappingURL=page.tsx.map

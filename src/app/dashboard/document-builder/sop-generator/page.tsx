/**
 * SOP Generator Page
 * Initial view: Input form only
 * After generation: Resizable AI Chat | Editor layout
 */
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, Download, ArrowLeft, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import UploadPanel from './components/UploadPanel';
import AIChat from './components/AIChat';
import Editor, { EditorHandle } from './components/Editor';
import { saveSOP, listSOPs, getSOP, deleteSOP, SOPSummary } from './lib/api';

function SOPGeneratorPageInner() {
  const searchParams = useSearchParams();
  const docIdFromUrl = searchParams?.get('id');
  const draftKeyFromUrl = searchParams?.get('draftKey');
  const editorRef = useRef<EditorHandle>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [sopId, setSopId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [existingSOPs, setExistingSOPs] = useState<SOPSummary[]>([]);
  const [activeSOPId, setActiveSOPId] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, unknown> | null>(null);
  const [mobileEditorMode, setMobileEditorMode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Load existing SOPs on first mount; if URL has ID, load that doc
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const summaries = await listSOPs(20);
        if (!mounted) return;
        setExistingSOPs(summaries);
        
        // Only load document if ID is explicitly provided in URL
        if (docIdFromUrl) {
          const doc = await getSOP(docIdFromUrl);
          if (!mounted) return;
          setGeneratedContent(doc.editor_json as Record<string, unknown>);
          setSopId(doc.id);
          setActiveSOPId(doc.id);
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
              const draft = parsed.documentDraft || (parsed as unknown as { editor_json?: Record<string, unknown> });
              if (draft && draft.editor_json) {
                setGeneratedContent(draft.editor_json as Record<string, unknown>);
                setSopId(null);
                setActiveSOPId(null);
                setHasGenerated(true);
              }
            }
          } catch (err) {
            console.error('Failed to load draft from localStorage', err);
          }
        }
        // Otherwise, show the create form (don't auto-load)
      } catch (e) {
        console.error('Failed to list existing SOPs', e);
      }
    })();
    return () => { mounted = false; };
  }, [docIdFromUrl, draftKeyFromUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleSelectExisting = async (id: string) => {
    try {
      const doc = await getSOP(id);
      setGeneratedContent(doc.editor_json as Record<string, unknown>);
      // Prefer HTML to preserve formatting; for older docs fix markdown '**' to <strong>
      const html = doc.html && doc.html.trim().length > 0
        ? convertMarkdownBoldToHtml(doc.html)
        : jsonToHtmlWithMarkdown(doc.editor_json as Record<string, unknown>);
      editorRef.current?.setContent(html);
      setSopId(doc.id);
      setActiveSOPId(doc.id);
      setHasGenerated(true);
    } catch (e) {
      console.error('Failed to load SOP', e);
    }
  };

  const handleNewSOP = () => {
    setGeneratedContent(null);
    setSopId(null);
    setActiveSOPId(null);
    setHasGenerated(false);
  };

  const handleFilesChange = (files: Array<{ file_id: string }>) => {
    setUploadedFileIds(files.map(f => f.file_id));
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const handleSOPGenerated = () => {
    setIsGenerating(false);
    setHasGenerated(true);
  };

  const handleGeneratedContent = (content: Record<string, unknown>) => {
    setGeneratedContent(content);
  };

  const handleBackToForm = () => {
    setHasGenerated(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const editorJson = editorRef.current?.getJSON();
      if (!editorJson) {
        throw new Error('No content to save');
      }
      // Use editor HTML to preserve styling (fonts, title)
      const html = editorRef.current?.getHTML() || '';

      const title = extractTitleFromEditorJSON(editorJson) || 'My Statement of Purpose';

      const response = await saveSOP({
        sop_id: sopId || undefined,
        title,
        editor_json: editorJson,
        html,
        metadata: { doc_type: 'sop' },
      });

      setSopId(response.sop_id);
      setSaveMessage('Saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Dynamic imports
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFonts = await import('pdfmake/build/vfs_fonts');
      // @ts-expect-error - html-to-pdfmake has no typescript definitions
      const htmlToPdfmake = (await import('html-to-pdfmake')).default;
      
      // Access pdfMake from default export
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      
      // Font helper function
      const loadFont = async (url: string): Promise<string> => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${url} - ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      // Font configurations - add fonts as needed
      const fontConfigs = {
        TimesNewRoman: {
          paths: {
            normal: '/fonts/times-new-roman/Times New Roman.ttf',
            bold: '/fonts/times-new-roman/Times New Roman - Bold.ttf',
            italics: '/fonts/times-new-roman/Times New Roman - Italic.ttf',
            bolditalics: '/fonts/times-new-roman/Times New Roman - Bold Italic.ttf',
          },
          vfsNames: {
            normal: 'TimesNewRoman.ttf',
            bold: 'TimesNewRoman-Bold.ttf',
            italics: 'TimesNewRoman-Italic.ttf',
            bolditalics: 'TimesNewRoman-BoldItalic.ttf',
          }
        },
        Arial: {
          paths: {
            normal: '/fonts/arial-font/arial.ttf',
            bold: '/fonts/arial-font/G_ari_bd.TTF',
            italics: '/fonts/arial-font/G_ari_i.TTF',
            bolditalics: '/fonts/arial-font/ARIBL0.ttf',
          },
          vfsNames: {
            normal: 'Arial.ttf',
            bold: 'Arial-Bold.ttf',
            italics: 'Arial-Italic.ttf',
            bolditalics: 'Arial-BoldItalic.ttf',
          }
        },
        Gelasio: {
          paths: {
            normal: '/fonts/Gelasio/static/Gelasio-Regular.ttf',
            bold: '/fonts/Gelasio/static/Gelasio-Bold.ttf',
            italics: '/fonts/Gelasio/static/Gelasio-Italic.ttf',
            bolditalics: '/fonts/Gelasio/static/Gelasio-BoldItalic.ttf',
          },
          vfsNames: {
            normal: 'Gelasio.ttf',
            bold: 'Gelasio-Bold.ttf',
            italics: 'Gelasio-Italic.ttf',
            bolditalics: 'Gelasio-BoldItalic.ttf',
          }
        },
        Inter: {
          paths: {
            normal: '/fonts/Inter/static/Inter_18pt-Regular.ttf',
            bold: '/fonts/Inter/static/Inter_18pt-Bold.ttf',
            italics: '/fonts/Inter/static/Inter_18pt-Italic.ttf',
            bolditalics: '/fonts/Inter/static/Inter_18pt-BoldItalic.ttf',
          },
          vfsNames: {
            normal: 'Inter.ttf',
            bold: 'Inter-Bold.ttf',
            italics: 'Inter-Italic.ttf',
            bolditalics: 'Inter-BoldItalic.ttf',
          }
        },
        Merriweather: {
          paths: {
            normal: '/fonts/Merriweather/static/Merriweather_24pt-Regular.ttf',
            bold: '/fonts/Merriweather/static/Merriweather_24pt-Bold.ttf',
            italics: '/fonts/Merriweather/static/Merriweather_24pt-Italic.ttf',
            bolditalics: '/fonts/Merriweather/static/Merriweather_24pt-BoldItalic.ttf',
          },
          vfsNames: {
            normal: 'Merriweather.ttf',
            bold: 'Merriweather-Bold.ttf',
            italics: 'Merriweather-Italic.ttf',
            bolditalics: 'Merriweather-BoldItalic.ttf',
          }
        },
      };

      // Load all fonts
      console.log('Loading fonts...');
      const vfs: Record<string, string> = { ...pdfFonts.vfs };
      const fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }> = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf'
        }
      };

      for (const [fontName, config] of Object.entries(fontConfigs)) {
        const [normal, bold, italics, bolditalics] = await Promise.all([
          loadFont(config.paths.normal),
          loadFont(config.paths.bold),
          loadFont(config.paths.italics),
          loadFont(config.paths.bolditalics),
        ]);

        vfs[config.vfsNames.normal] = normal;
        vfs[config.vfsNames.bold] = bold;
        vfs[config.vfsNames.italics] = italics;
        vfs[config.vfsNames.bolditalics] = bolditalics;

        fonts[fontName] = {
          normal: config.vfsNames.normal,
          bold: config.vfsNames.bold,
          italics: config.vfsNames.italics,
          bolditalics: config.vfsNames.bolditalics,
        };
      }
      console.log('All fonts loaded successfully');

      // Get HTML content
      const html = editorRef.current?.getHTML();
      if (!html) {
        alert('No content to download.');
        return;
      }

      // Convert HTML to pdfmake format
      const ret = htmlToPdfmake(html);

      // Detect font from HTML content (default to Times New Roman)
      let selectedFont = 'TimesNewRoman';
      if (html.includes('font-family: Arial')) selectedFont = 'Arial';
      else if (html.includes('font-family: Gelasio')) selectedFont = 'Gelasio';
      else if (html.includes('font-family: Inter')) selectedFont = 'Inter';
      else if (html.includes('font-family: Merriweather')) selectedFont = 'Merriweather';

      // Create PDF document definition
      const docDefinition = {
        content: ret,
        pageSize: 'LETTER' as const,
        pageMargins: [72, 72, 72, 72] as [number, number, number, number], // 1 inch = 72 points
        defaultStyle: {
          font: selectedFont,
          fontSize: 12,
          lineHeight: 1.5,
          alignment: 'justify' as const,
        },
        styles: {
          h1: {
            fontSize: 16,
            bold: true,
            alignment: 'center' as const,
            margin: [0, 0, 0, 18] as [number, number, number, number],
          },
          h2: {
            fontSize: 14,
            bold: true,
            margin: [0, 14, 0, 8] as [number, number, number, number],
          },
          h3: {
            fontSize: 12,
            bold: true,
            margin: [0, 12, 0, 6] as [number, number, number, number],
          },
          p: {
            margin: [0, 0, 0, 12] as [number, number, number, number],
          },
        },
      };

      // Generate and download PDF
      const pdfDocGenerator = pdfMake.createPdf(docDefinition, undefined, fonts, vfs);
      pdfDocGenerator.download('statement-of-purpose.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };




  // Note: Auto-save removed - SOPs are now saved when clicking "Open SOP Editor" from chat
  // This prevents duplicate empty SOPs from being created

  const handleDelete = async () => {
    if (!sopId) return;
    const ok = window.confirm('Delete this SOP? This action cannot be undone.');
    if (!ok) return;
    try {
      await deleteSOP(sopId);
      // Refresh list and reset view
      const summaries = await listSOPs(20);
      setExistingSOPs(summaries);
      setSopId(null);
      setActiveSOPId(null);
      setGeneratedContent(null);
      setHasGenerated(false);
    } catch (e) {
      console.error('Failed to delete SOP', e);
      setSaveMessage(e instanceof Error ? e.message : 'Delete failed');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <DashboardLayout>
      {isGenerating ? (
        // Generating Phase: Loading State
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <h2 className="text-2xl font-semibold">Generating Your SOP...</h2>
            <p className="text-gray-600">AI is crafting your statement of purpose</p>
          </div>
        </div>
      ) : !hasGenerated ? (
        // Initial View: Form Only
        <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 sm:p-7 shadow-sm">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 right-0 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-2xl" />
              <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-200/40 via-blue-200/20 to-transparent blur-2xl" />
            </div>
            <div className="relative">
              <h1 className="text-2xl lg:text-4xl font-bold mb-2 lg:mb-3 text-slate-900">AI SOP Generator</h1>
              <p className="text-slate-600 text-sm lg:text-lg max-w-2xl">
                Create compelling Statements of Purpose that tell your unique story and stand out.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <UploadPanel onFilesChange={handleFilesChange} />
            </div>

            {/* Form Section */}
            <div className="lg:col-span-3">
              <AIChat
                editorRef={editorRef}
                uploadedFileIds={uploadedFileIds}
                onGenerationStart={handleGenerationStart}
                onSOPGenerated={handleSOPGenerated}
                onGeneratedContent={handleGeneratedContent}
                isGenerating={false}
              />
            </div>
          </div>
        </div>
      ) : (
        // Generated View: Resizable AI Chat | Editor
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Header */}
          <div className="bg-white/90 border-b border-slate-200/60 px-3 lg:px-4 py-2 lg:py-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 lg:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToForm}
                  className="px-2 lg:px-3"
                >
                  <ArrowLeft className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Back</span>
                </Button>
                <div>
                  <h2 className="text-sm lg:text-lg font-semibold">Statement of Purpose</h2>
                  <p className="text-xs text-gray-500 hidden sm:block">AI-powered editor</p>
                </div>
              </div>
              <div className="flex gap-1 lg:gap-2 items-center flex-wrap">
                {existingSOPs.length > 0 && (
                  <select
                    className="text-xs lg:text-sm border rounded px-1 lg:px-2 py-1 max-w-[120px] lg:max-w-none"
                    value={activeSOPId || ''}
                    onChange={(e) => handleSelectExisting(e.target.value)}
                  >
                    <option value="" disabled>My SOPs</option>
                    {existingSOPs.map(s => (
                      <option key={s.id} value={s.id}>{s.title || 'Untitled'}</option>
                    ))}
                  </select>
                )}
                <Button variant="outline" size="sm" onClick={handleNewSOP} disabled={isGenerating} className="px-2 lg:px-3 text-xs lg:text-sm">
                  <span className="hidden sm:inline">New</span>
                  <span className="sm:hidden">+</span>
                </Button>
                {saveMessage && (
                  <span className="text-xs lg:text-sm text-green-600 self-center">
                    {saveMessage}
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={handleDownload} className="px-2 lg:px-3">
                  <Download className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Download</span>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={!sopId} className="px-2 lg:px-3">
                  <Trash2 className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Delete</span>
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="px-2 lg:px-3">
                  <Save className="h-4 w-4 lg:mr-2" />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile: Stacked Layout, Desktop: Resizable */}
          <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
            {/* Mobile Tab Switcher */}
            <div className="border-b border-slate-200/60 bg-white/90 px-3 py-2">
              <div className="mx-auto flex w-full max-w-[420px] rounded-full bg-slate-100 p-1 text-sm">
                <button
                  className={`flex-1 rounded-full px-3 py-2 font-medium transition ${!mobileEditorMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  onClick={() => setMobileEditorMode(false)}
                  aria-pressed={!mobileEditorMode}
                >
                  AI
                </button>
                <button
                  className={`flex-1 rounded-full px-3 py-2 font-medium transition ${mobileEditorMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  onClick={() => setMobileEditorMode(true)}
                  aria-pressed={mobileEditorMode}
                >
                  Preview
                </button>
              </div>
            </div>
            
            {/* Mobile Content */}
            <div className="flex-1 overflow-hidden">
              {!mobileEditorMode ? (
                <div className="h-full overflow-auto bg-gray-50">
                  <AIChat
                    editorRef={editorRef}
                    uploadedFileIds={uploadedFileIds}
                    onGenerationStart={handleGenerationStart}
                    onSOPGenerated={handleSOPGenerated}
                    onGeneratedContent={handleGeneratedContent}
                    isGenerating={true}
                  />
                </div>
              ) : (
                <div className="h-full overflow-auto bg-white">
                  <Editor ref={editorRef} initialContent={generatedContent || undefined} />
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Resizable Layout */}
          {isDesktop && (
          <ResizablePanelGroup direction="horizontal" className="flex-1 hidden lg:flex">
            {/* AI Chat Panel */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full overflow-hidden bg-gray-50">
                <AIChat
                  editorRef={editorRef}
                  uploadedFileIds={uploadedFileIds}
                  onGenerationStart={handleGenerationStart}
                  onSOPGenerated={handleSOPGenerated}
                  onGeneratedContent={handleGeneratedContent}
                  isGenerating={true}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Editor Panel */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="h-full overflow-auto bg-white relative">
                <Editor ref={editorRef} initialContent={generatedContent || undefined} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SOPGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SOPGeneratorPageInner />
    </Suspense>
  );
}

/**
 * Title extractor from TipTap JSON (first H1)
 */
type TipTapNode = { type: string; attrs?: { level?: number }; content?: TipTapNode[]; text?: string };

function extractTitleFromEditorJSON(json: Record<string, unknown>): string | null {
  const content = (json as { content?: TipTapNode[] }).content;
  if (!content || content.length === 0) return null;
  const firstHeading = content.find(
    (node) => node?.type === 'heading' && node?.attrs?.level === 1
  );
  if (!firstHeading) return null;
  const nodes = firstHeading.content || [];
  const text = nodes
    .filter((n) => n.type === 'text')
    .map((n) => n.text || '')
    .join('');
  return text || null;
}

// Convert legacy HTML or plain text with markdown markers to proper HTML
function convertMarkdownBoldToHtml(input: string): string {
  // simple replacements for **bold** and *italic* within paragraphs
  let out = input;
  // Replace bold first
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Then italic (single *)
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  // Replace __bold__ and _italic_
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');
  return out;
}

// Build HTML from TipTap JSON and convert markdown markers
function jsonToHtmlWithMarkdown(json: Record<string, unknown>): string {
  const nodes = (json as { content?: TipTapNode[] }).content || [];
  const parts: string[] = [];
  for (const node of nodes) {
    if (node.type === 'heading' && node.attrs?.level === 1) {
      const text = (node.content || []).map(n => n.text || '').join('');
      parts.push(`<h1>${text}</h1>`);
    } else if (node.type === 'paragraph') {
      const text = (node.content || []).map(n => n.text || '').join('');
      parts.push(`<p>${convertMarkdownBoldToHtml(text)}</p>`);
    }
    // ignore other nodes (e.g., old H2 headings)
  }
  return parts.join('\n');
}

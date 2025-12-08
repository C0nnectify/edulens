/**
 * Upload Panel Component
 * Handles file upload with drag-and-drop support for CV/Resume and Transcripts
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, File, X, FileText, GraduationCap, CheckSquare, Square } from 'lucide-react';
import { uploadFile, listUploadedFiles, UploadedFileInfo } from '../lib/api';

interface UploadedFile {
  file_id: string;
  filename: string;
  text_preview: string;
  doc_type: 'cv' | 'transcript';
}

interface UploadPanelProps {
  onFilesChange?: (files: UploadedFile[]) => void;
}

function mapToInternalDocType(docType?: string | null): 'cv' | 'transcript' {
  if (!docType) return 'cv';
  const normalized = docType.toLowerCase();
  return normalized === 'transcript' ? 'transcript' : 'cv';
}

export default function UploadPanel({ onFilesChange }: UploadPanelProps) {
  const [cvFiles, setCvFiles] = useState<UploadedFile[]>([]);
  const [transcriptFiles, setTranscriptFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActiveCv, setDragActiveCv] = useState(false);
  const [dragActiveTranscript, setDragActiveTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousUploads, setPreviousUploads] = useState<UploadedFileInfo[]>([]);
  const [selectedPreviousFiles, setSelectedPreviousFiles] = useState<UploadedFile[]>([]);

  const previousCvUploads = useMemo(
    () => previousUploads.filter(file => mapToInternalDocType(file.doc_type) === 'cv'),
    [previousUploads],
  );
  const previousTranscriptUploads = useMemo(
    () => previousUploads.filter(file => mapToInternalDocType(file.doc_type) === 'transcript'),
    [previousUploads],
  );

  const emitMergedFiles = (nextCv: UploadedFile[], nextTranscript: UploadedFile[], nextSelected: UploadedFile[]) => {
    const dedup = new Map<string, UploadedFile>();
    [...nextCv, ...nextTranscript, ...nextSelected].forEach(file => {
      dedup.set(file.file_id, file);
    });
    onFilesChange?.(Array.from(dedup.values()));
  };

  // Load previous uploads on mount
  useEffect(() => {
    const loadPreviousUploads = async () => {
      try {
        const uploadedFilesList = await listUploadedFiles(20);
        setPreviousUploads(uploadedFilesList);
      } catch (err) {
        console.error('Failed to load previous uploads:', err);
      }
    };
    loadPreviousUploads();
  }, []);

  const handleFileUpload = async (files: FileList | null, docType: 'cv' | 'transcript') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(file =>
        uploadFile(file, docType === 'cv' ? 'resume' : 'transcript')
      );
      const results = await Promise.all(uploadPromises);
      
      const newFiles = results.map(r => ({ ...r, doc_type: docType }));
      
      if (docType === 'cv') {
        const updated = [...cvFiles, ...newFiles];
        setCvFiles(updated);
        emitMergedFiles(updated, transcriptFiles, selectedPreviousFiles);
      } else {
        const updated = [...transcriptFiles, ...newFiles];
        setTranscriptFiles(updated);
        emitMergedFiles(cvFiles, updated, selectedPreviousFiles);
      }
      
      // Refresh previous uploads list
      const uploadedFilesList = await listUploadedFiles(20);
      setPreviousUploads(uploadedFilesList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const togglePreviousFile = (fileInfo: UploadedFileInfo) => {
    const isSelected = selectedPreviousFiles.some(f => f.file_id === fileInfo.file_id);
    const docType = mapToInternalDocType(fileInfo.doc_type);
    
    if (isSelected) {
      // Deselect
      const updated = selectedPreviousFiles.filter(f => f.file_id !== fileInfo.file_id);
      setSelectedPreviousFiles(updated);
      // Notify parent with merged files
      emitMergedFiles(cvFiles, transcriptFiles, updated);
    } else {
      // Select - convert to UploadedFile format
      const uploadedFile: UploadedFile = {
        file_id: fileInfo.file_id,
        filename: fileInfo.filename,
        text_preview: fileInfo.text_preview || '',
        doc_type: docType,
      };
      const updated = [...selectedPreviousFiles, uploadedFile];
      setSelectedPreviousFiles(updated);
      // Notify parent with merged files
      emitMergedFiles(cvFiles, transcriptFiles, updated);
    }
  };

  const handleDragCv = (e: React.DragEvent, entering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCv(entering);
  };

  const handleDragTranscript = (e: React.DragEvent, entering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveTranscript(entering);
  };

  const handleDropCv = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCv(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFileUpload(e.dataTransfer.files, 'cv');
    }
  };

  const handleDropTranscript = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveTranscript(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFileUpload(e.dataTransfer.files, 'transcript');
    }
  };

  const removeFile = (fileId: string, docType: 'cv' | 'transcript') => {
    if (docType === 'cv') {
      const newFiles = cvFiles.filter(f => f.file_id !== fileId);
      setCvFiles(newFiles);
      emitMergedFiles(newFiles, transcriptFiles, selectedPreviousFiles);
    } else {
      const newFiles = transcriptFiles.filter(f => f.file_id !== fileId);
      setTranscriptFiles(newFiles);
      emitMergedFiles(cvFiles, newFiles, selectedPreviousFiles);
    }
  };

  const UploadSection = ({
    title,
    icon: Icon,
    docType,
    files,
    dragActive,
    onDrag,
    onDrop,
    previousFiles,
    onTogglePrevious,
    selectedPreviousIds,
  }: {
    title: string;
    icon: typeof FileText;
    docType: 'cv' | 'transcript';
    files: UploadedFile[];
    dragActive: boolean;
    onDrag: (e: React.DragEvent, entering: boolean) => void;
    onDrop: (e: React.DragEvent) => void;
    previousFiles: UploadedFileInfo[];
    onTogglePrevious: (file: UploadedFileInfo) => void;
    selectedPreviousIds: Set<string>;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-gray-700" />
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      
      <Card
        className={`border-2 border-dashed p-8 text-center transition-all hover:border-gray-400 ${
          dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-300'
        }`}
        onDragEnter={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDragOver={(e) => { e.preventDefault(); onDrag(e, true); }}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gray-100 p-4">
            <Upload className="h-10 w-10 text-gray-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Drag and drop or
            </p>
            <label htmlFor={`file-upload-${docType}`}>
              <Button
                variant="link"
                size="default"
                className="cursor-pointer h-auto p-0 text-base font-medium"
                disabled={uploading}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`file-upload-${docType}`)?.click();
                }}
              >
                browse files
              </Button>
            </label>
            <input
              id={`file-upload-${docType}`}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => void handleFileUpload(e.target.files, docType)}
              disabled={uploading}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            PDF, DOCX, TXT
          </p>
        </div>
      </Card>

      {previousFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Previously uploaded</p>
          {previousFiles.map(file => {
            const selected = selectedPreviousIds.has(file.file_id);
            return (
              <button
                key={file.file_id}
                onClick={() => onTogglePrevious(file)}
                className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                }`}
              >
                <div className="mt-0.5">
                  {selected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900">{file.filename}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Uploaded {new Date(file.upload_date).toLocaleDateString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.file_id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-50 p-2">
                  <File className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.filename}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.file_id, docType)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Upload Documents</h3>
        {previousUploads.length > 0 && (
          <span className="text-sm text-gray-500">{previousUploads.length} files available from previous uploads</span>
        )}
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {previousUploads.length > 0 && selectedPreviousFiles.length > 0 && (
        <Card className="p-4 bg-blue-50/40 border-blue-100 text-sm text-blue-800 flex items-center">
          <span>
            {selectedPreviousFiles.length} file{selectedPreviousFiles.length !== 1 ? 's' : ''} added from previous uploads.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPreviousFiles([]);
              emitMergedFiles(cvFiles, transcriptFiles, []);
            }}
            className="ml-auto h-8 px-2 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
          >
            Clear
          </Button>
        </Card>
      )}

      <UploadSection
        title="CV / Resume"
        icon={FileText}
        docType="cv"
        files={cvFiles}
        dragActive={dragActiveCv}
        onDrag={handleDragCv}
        onDrop={handleDropCv}
        previousFiles={previousCvUploads}
        onTogglePrevious={togglePreviousFile}
        selectedPreviousIds={new Set(selectedPreviousFiles.filter(f => f.doc_type === 'cv').map(f => f.file_id))}
      />

      <UploadSection
        title="Transcripts / Marksheets"
        icon={GraduationCap}
        docType="transcript"
        files={transcriptFiles}
        dragActive={dragActiveTranscript}
        onDrag={handleDragTranscript}
        onDrop={handleDropTranscript}
        previousFiles={previousTranscriptUploads}
        onTogglePrevious={togglePreviousFile}
        selectedPreviousIds={new Set(selectedPreviousFiles.filter(f => f.doc_type === 'transcript').map(f => f.file_id))}
      />
    </div>
  );
}

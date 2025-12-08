/**
 * Document Upload Component
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, File, X, Check } from 'lucide-react';
import { useDocumentUpload } from '@/hooks/useDocumentAI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_TAGS = [
  { value: 'magicfill', label: 'Magic Fill', color: 'bg-blue-500' },
  { value: 'research', label: 'Research', color: 'bg-purple-500' },
  { value: 'general', label: 'General', color: 'bg-gray-500' },
  { value: 'academic', label: 'Academic', color: 'bg-green-500' },
  { value: 'personal', label: 'Personal', color: 'bg-yellow-500' },
];

interface DocumentUploadProps {
  onUploadComplete?: (result: any) => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['general']);
  const [dragActive, setDragActive] = useState(false);
  const { upload, uploading, progress, error } = useDocumentUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await upload(selectedFile, selectedTags);
      setSelectedFile(null);
      setSelectedTags(['general']);
      onUploadComplete?.(result);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload PDF, DOCX, TXT, or image files. AI will extract text and create searchable embeddings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-700'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.txt,.md,image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <File className="mx-auto h-12 w-12 text-primary" />
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop your file here, or{' '}
                <label
                  htmlFor="file-upload"
                  className="text-primary cursor-pointer hover:underline"
                >
                  browse
                </label>
              </p>
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOCX, TXT, MD, Images (max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Tag Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <Badge
                key={tag.value}
                variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.value)}
              >
                {selectedTags.includes(tag.value) && (
                  <Check className="h-3 w-3 mr-1" />
                )}
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              Uploading... {progress}%
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
}

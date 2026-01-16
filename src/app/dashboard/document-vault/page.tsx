"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, Trash2, Calendar, Loader2, Plus, File as FileIcon, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserFiles } from "@/hooks/useUserFiles";

export default function DocumentVaultPage() {
  const { files, loading, error, uploadProgress, fetchFiles, uploadFile, deleteFile } = useUserFiles();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        await uploadFile(file, { docType: 'document' });
      }
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    await deleteFile(fileId);
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return ImageIcon;
    if (type.includes("pdf")) return FileText;
    if (type.includes("spreadsheet") || type.includes("excel")) return FileSpreadsheet;
    return FileIcon;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 sm:p-7 shadow-sm">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 right-0 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-2xl" />
            <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-200/40 via-blue-200/20 to-transparent blur-2xl" />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-indigo-600/90">File Storage</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 mt-2">
                <Upload className="h-6 w-6 text-blue-600" />
                <span>Document Vault</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                A central place for all of your uploaded documents — accessible everywhere in EduLens.
              </p>
            </div>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
                className="gap-2 w-full sm:w-auto"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Upload Files
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Upload Progress */}
          {uploadProgress.filter(p => p.status !== 'completed').length > 0 && (
            <Card className="border-slate-200/60 bg-white/90">
              <CardHeader>
                <CardTitle className="text-sm">Uploading Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {uploadProgress.filter(p => p.status !== 'completed').map((progress) => (
                  <div key={progress.fileId} className="flex items-center gap-3">
                    {progress.status === 'error' ? (
                      <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{progress.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {progress.status === 'error' ? progress.error || 'Upload failed' : progress.status}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Files List */}
          <Card className="border-slate-200/60 bg-white/90">
            <CardHeader>
              <CardTitle>Your Documents</CardTitle>
              <CardDescription>
                {files.length} document{files.length !== 1 ? 's' : ''} in your vault
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && files.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Loading documents...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  {error}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">No documents yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your first document to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => {
                    const Icon = getFileIcon(file.type);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 border border-slate-200/60 rounded-xl hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-2 rounded bg-blue-100 text-blue-600">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{file.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(file.uploadedAt)}
                              </span>
                              <span>{formatFileSize(file.size)}</span>
                              {file.source && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px]">
                                  {file.source}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id, file.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 bg-white/90">
            <CardHeader>
              <CardTitle>Centralized File Storage</CardTitle>
              <CardDescription>
                Files uploaded here are automatically available across the entire application.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>✓ Attach vault documents in the AI chat via the "+" file picker.</p>
              <p>✓ Use them as context for SOP, LOR, CV, and Resume generation.</p>
              <p>✓ Access them during document analysis in Document Builder.</p>
              <p>✓ Search and query them from the Document AI page.</p>
              <p>✓ All files are organized per user and accessible everywhere.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  url?: string;
  extractedData?: any;
}

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach(file => {
      simulateUpload(file.id);
    });
  }, []);

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          if (file.status === 'uploading' && file.progress < 100) {
            return { ...file, progress: file.progress + 10 };
          } else if (file.status === 'uploading' && file.progress >= 100) {
            return { ...file, status: 'processing', progress: 0 };
          } else if (file.status === 'processing' && file.progress < 100) {
            return { ...file, progress: file.progress + 20 };
          } else if (file.status === 'processing' && file.progress >= 100) {
            clearInterval(interval);
            return {
              ...file,
              status: 'completed',
              progress: 100,
              extractedData: {
                text: 'Sample extracted text...',
                metadata: { pages: 3, words: 450 }
              }
            };
          }
        }
        return file;
      }));
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📘';
    if (type.includes('text')) return '📝';
    return '📄';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload your documents
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, DOC, DOCX, and TXT files up to 10MB
            </p>
            <Button className="mt-4">
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="text-2xl">{getFileIcon(file.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <Badge className={getStatusColor(file.status)}>
                        {file.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>

                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <Progress value={file.progress} className="flex-1" />
                          <span className="text-sm text-gray-500">{file.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.status === 'uploading' ? 'Uploading...' : 'Processing with AI...'}
                        </p>
                      </div>
                    )}

                    {file.status === 'completed' && file.extractedData && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>✅ Successfully processed</p>
                        <p>📊 {file.extractedData.metadata.pages} pages, {file.extractedData.metadata.words} words extracted</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && (
                      <>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            What happens after upload?
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Secure Upload</p>
                <p className="text-sm text-gray-600">Your files are uploaded securely and encrypted</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI Processing</p>
                <p className="text-sm text-gray-600">Our AI extracts and analyzes content from your documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ready to Use</p>
                <p className="text-sm text-gray-600">Use extracted data for document generation and applications</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
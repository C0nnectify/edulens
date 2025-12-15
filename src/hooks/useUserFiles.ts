/**
 * Custom hook for centralized file management
 * 
 * This hook provides a unified interface for managing user files
 * across the application. Files uploaded through this hook are
 * accessible everywhere: document builders, chat, document vault, etc.
 */

import { useState, useCallback } from 'react';

export type UserFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt?: string;
  source?: string;
  textPreview?: string;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | string;
};

export type UploadProgress = {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
};

export function useUserFiles() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());

  /**
   * Fetch all user files from centralized storage
   */
  const fetchFiles = useCallback(async (options?: { limit?: number; page?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const limit = options?.limit || 100;
      const page = options?.page || 1;
      
      const response = await fetch(`/api/user-files?limit=${limit}&page=${page}`, {
        headers: {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      
      const data = await response.json();
      setFiles(data.files || []);
      return data.files || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files';
      setError(errorMessage);
      console.error('Error fetching files:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new file to centralized storage
   */
  const uploadFile = useCallback(async (
    file: File,
    options?: { docType?: string; tags?: string[] }
  ): Promise<UserFile | null> => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Add to upload progress
    setUploadProgress(prev => new Map(prev).set(tempId, {
      fileId: tempId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', options?.docType || 'document');
      if (options?.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }
      
      const response = await fetch('/api/user-files', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.file) {
        throw new Error(data.error || 'Upload failed');
      }

      const normalizedStatus =
        data.file.processingStatus === 'completed'
          ? 'completed'
          : data.file.processingStatus === 'failed'
            ? 'error'
            : 'processing';
      
      // Update progress to completed
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(data.file.id, {
          fileId: data.file.id,
          fileName: data.file.name,
          progress: 100,
          status: normalizedStatus,
        });
        newMap.delete(tempId);
        return newMap;
      });
      
      // Add to files list
      setFiles(prev => [data.file, ...prev]);
      
      return data.file;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      
      // Update progress to error
      setUploadProgress(prev => new Map(prev).set(tempId, {
        fileId: tempId,
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage,
      }));
      
      console.error('Error uploading file:', err);
      return null;
    }
  }, []);

  /**
   * Delete a file from MongoDB and ChromaDB
   */
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/user-files?id=${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: {},
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = data?.error || data?.detail || `Delete failed (${response.status})`;
        throw new Error(message);
      }

      if (!data?.success) {
        const message = data?.error || 'Delete failed';
        throw new Error(message);
      }
      
      // Remove from local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      console.error('Error deleting file:', err);
      return false;
    }
  }, []);

  /**
   * Clear upload progress for completed/error uploads
   */
  const clearUploadProgress = useCallback((fileId: string) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  return {
    files,
    loading,
    error,
    uploadProgress: Array.from(uploadProgress.values()),
    fetchFiles,
    uploadFile,
    deleteFile,
    clearUploadProgress,
  };
}

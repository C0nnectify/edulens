/**
 * Document List Component
 */

'use client';

import { useEffect, useState } from 'react';
import { FileText, Trash2, Tag, Calendar, MoreVertical } from 'lucide-react';
import { useDocumentList } from '@/hooks/useDocumentAI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentListProps {
  onDocumentSelect?: (document: any) => void;
  refreshTrigger?: number;
  filterTags?: string[];
}

export function DocumentList({
  onDocumentSelect,
  refreshTrigger,
  filterTags,
}: DocumentListProps) {
  const { documents, loading, error, total, loadDocuments, deleteDocument } = useDocumentList();
  const [selectedTags, setSelectedTags] = useState<string[]>(filterTags || []);

  useEffect(() => {
    loadDocuments({
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      limit: 50,
    });
  }, [loadDocuments, refreshTrigger, selectedTags]);

  useEffect(() => {
    if (filterTags) {
      setSelectedTags(filterTags);
    }
  }, [filterTags]);

  const handleDelete = async (documentId: string, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;

    try {
      await deleteDocument(documentId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileTypeColor = (fileType: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-500',
      docx: 'bg-blue-500',
      txt: 'bg-gray-500',
      image: 'bg-green-500',
    };
    return colors[fileType] || 'bg-gray-500';
  };

  if (loading && documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Loading documents...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground">
              Upload your first document to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Documents</CardTitle>
        <CardDescription>
          {total} document{total !== 1 ? 's' : ''} in your collection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => onDocumentSelect?.(doc)}
            >
              <div className="flex items-start space-x-4 flex-1">
                {/* File Icon */}
                <div className={`p-2 rounded ${getFileTypeColor(doc.file_type)} text-white`}>
                  <FileText className="h-5 w-5" />
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{doc.filename}</h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.uploaded_at)}
                    </span>
                    <span>{doc.total_chunks} chunks</span>
                    <span className="uppercase">{doc.file_type}</span>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {doc.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDocumentSelect?.(doc);
                    }}
                  >
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.document_id, doc.filename);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

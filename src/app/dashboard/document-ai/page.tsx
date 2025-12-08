/**
 * Document AI Page
 *
 * Main interface for document upload, management, and AI-powered search
 */

'use client';

import { useState } from 'react';
import { FileText, Search, Upload } from 'lucide-react';
import { DocumentUpload } from '@/components/document-ai/DocumentUpload';
import { DocumentList } from '@/components/document-ai/DocumentList';
import { SearchInterface } from '@/components/document-ai/SearchInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DocumentAIPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handleUploadComplete = (result: any) => {
    console.log('Upload complete:', result);
    // Refresh document list
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    console.log('Selected document:', document);
    // TODO: Show document details in a modal or sidebar
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Document AI</h1>
          <p className="text-muted-foreground">
            Upload, manage, and search your documents with AI-powered semantic search
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
            <SearchInterface />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <DocumentList
              onDocumentSelect={handleDocumentSelect}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <div className="grid gap-6 lg:grid-cols-2">
              <DocumentUpload onUploadComplete={handleUploadComplete} />

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>
                    What you can do with Document AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">📄 Multi-Format Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload PDF, DOCX, TXT, Markdown, and image files
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">🤖 AI-Powered Search</h4>
                    <p className="text-sm text-muted-foreground">
                      Semantic search understands meaning, not just keywords
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">🖼️ OCR for Images</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically extract text from images and scanned documents
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">🏷️ Smart Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      Tag documents for quick filtering and categorization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">⚡ Instant Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Query specific documents or search across your entire collection
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">🔒 Private & Secure</h4>
                    <p className="text-sm text-muted-foreground">
                      Your documents are isolated and only accessible to you
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats Footer */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground mt-1">Search Modes</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Semantic, Keyword, Hybrid
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">50MB</p>
                <p className="text-sm text-muted-foreground mt-1">Max File Size</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Per document upload
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">∞</p>
                <p className="text-sm text-muted-foreground mt-1">Documents</p>
                <p className="text-xs text-muted-foreground mt-2">
                  No upload limit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

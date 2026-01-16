'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  FileUp,
  FileText,
  Star,
  Grid3x3,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Resume, IndustryCategory } from '@/types/resume';
import { ResumeCard } from './ResumeCard';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ResumeListViewProps {
  documentType?: 'resume' | 'cv';
}

type SortOption = 'updatedAt' | 'createdAt' | 'title' | 'atsScore';
type ViewMode = 'grid' | 'list';

export function ResumeListView({ documentType = 'resume' }: ResumeListViewProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch resumes
  const fetchResumes = async () => {
    try {
      setLoading(true);
      if (documentType === 'resume') {
        const params = new URLSearchParams({
          page: '1',
          limit: '100',
          sort: sortBy === 'title' ? 'title' : '-updatedAt',
        });
        const response = await fetch(`/api/resume?${params}`);
        const data = await response.json();
        if (data?.success && data?.data?.resumes) {
          setResumes(data.data.resumes);
        }
        return;
      }

      const params = new URLSearchParams({ page: '1', limit: '100' });
      const response = await fetch(`/api/cv?${params}`);
      const data = await response.json();
      if (data?.success && data?.data?.cvs) {
        setResumes(data.data.cvs);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [sortBy, filterCategory, filterFavorites]);

  // Handlers
  const handleEdit = (resumeId: string) => {
    if (documentType === 'resume') {
      router.push(`/dashboard/document-builder/resume/editor-v2?id=${resumeId}`);
    } else {
      router.push(`/dashboard/document-builder/cv/editor-v2?id=${resumeId}`);
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        fetchResumes();
      }
    } catch (error) {
      console.error('Failed to duplicate resume:', error);
    }
  };

  const handleDelete = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchResumes();
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  const handleToggleFavorite = async (resumeId: string) => {
    try {
      const resume = resumes.find(r => (r.id || r._id) === resumeId);
      if (!resume) return;

      const response = await fetch(`/api/resume/${resumeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...resume.metadata,
            isFavorite: !resume.metadata?.isFavorite,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchResumes();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCreateNew = async (template?: string) => {
    try {
      if (documentType === 'resume') {
        const response = await fetch('/api/resume/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Untitled Resume',
            template,
          }),
        });

        const data = await response.json();

        if (data.success && data.resume) {
          router.push(`/dashboard/document-builder/resume/editor-v2?id=${data.resume._id}`);
        }
        return;
      }

      const response = await fetch('/api/cv/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled CV',
          template,
        }),
      });

      const data = await response.json();
      if (data.success && data.cv) {
        router.push(`/dashboard/document-builder/cv/editor-v2?id=${data.cv._id}`);
      }
    } catch (error) {
      console.error('Failed to create resume:', error);
    }
  };

  // Filter resumes by search
  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.metadata?.tags?.some(tag =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="mx-auto py-4 lg:py-8 px-3 lg:px-4">
      {/* Header */}
      <div className="mb-4 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">My {documentType === 'cv' ? 'CVs' : 'Resumes'}</h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              {filteredResumes.length} {documentType === 'cv' ? 'CV' : 'resume'}{filteredResumes.length !== 1 && 's'}
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Create {documentType === 'cv' ? 'CV' : 'Resume'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New {documentType === 'cv' ? 'CV' : 'Resume'}</DialogTitle>
                <DialogDescription>
                  Choose how you want to create your {documentType === 'cv' ? 'CV' : 'resume'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => {
                    handleCreateNew();
                    setShowCreateDialog(false);
                  }}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Blank {documentType === 'cv' ? 'CV' : 'Resume'}</div>
                    <div className="text-sm text-muted-foreground">
                      Start from scratch
                    </div>
                  </div>
                </Button>
                {documentType !== 'cv' && (
                  <>
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        router.push('/dashboard/document-builder/resume/templates');
                        setShowCreateDialog(false);
                      }}
                    >
                      <Grid3x3 className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">From Template</div>
                        <div className="text-sm text-muted-foreground">
                          Choose from 21+ industry-specific templates
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        router.push('/dashboard/document-builder/resume/import');
                        setShowCreateDialog(false);
                      }}
                    >
                      <FileUp className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Import Resume</div>
                        <div className="text-sm text-muted-foreground">
                          From LinkedIn, PDF, DOCX, or JSON
                        </div>
                      </div>
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 lg:gap-2 flex-shrink-0 h-10 px-2 lg:px-3">
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {(filterFavorites || filterCategory !== 'all') && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                      {(filterFavorites ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterFavorites(!filterFavorites)}>
                  <Star className={cn('mr-2 h-4 w-4', filterFavorites && 'fill-yellow-500 text-yellow-500')} />
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Industry</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filterCategory} onValueChange={setFilterCategory}>
                  <DropdownMenuRadioItem value="all">All Industries</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={IndustryCategory.HEALTHCARE}>Healthcare</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={IndustryCategory.TECHNOLOGY}>Technology</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={IndustryCategory.ENGINEERING}>Engineering</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={IndustryCategory.DESIGN}>Design</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={IndustryCategory.BUSINESS}>Business</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 lg:gap-2 flex-shrink-0 h-10 px-2 lg:px-3">
                  <SortAsc className="w-4 h-4" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <DropdownMenuRadioItem value="updatedAt">Recently Updated</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="createdAt">Recently Created</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">Name (A-Z)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="atsScore">ATS Score</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode */}
            <div className="flex border rounded-md flex-shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none h-10 w-10"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-l-none h-10 w-10"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading resumes...</p>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="text-center py-8 lg:py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed">
          <FileText className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-base lg:text-lg font-semibold mb-2">No resumes yet</h3>
          <p className="text-muted-foreground mb-6 text-sm lg:text-base px-4">
            {searchQuery ? 'No resumes match your search' : 'Create your first resume to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 w-4 h-4" />
              Create Your First Resume
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
              : 'space-y-3 lg:space-y-4'
          )}
        >
          {filteredResumes.map((resume) => (
            <ResumeCard
              key={resume.id || resume._id}
              resume={resume}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

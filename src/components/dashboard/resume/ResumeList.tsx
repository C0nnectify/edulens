'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Resume } from '@/types/resume';
import { resumeApi } from '@/lib/api/resume-api';
import { FileText, Plus, Search, MoreVertical, Copy, Trash2, Eye, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResumeListProps {
  onSelectResume: (resume: Resume) => void;
  onCreateResume: () => void;
}

export function ResumeList({ onSelectResume, onCreateResume }: ResumeListProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = resumes.filter(
        (resume) =>
          resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resume.personalInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResumes(filtered);
    } else {
      setFilteredResumes(resumes);
    }
  }, [searchQuery, resumes]);

  const loadResumes = async () => {
    try {
      const data = await resumeApi.listResumes();
      // Ensure data is an array
      const resumeArray = Array.isArray(data) ? data : [];
      setResumes(resumeArray);
      setFilteredResumes(resumeArray);
    } catch (error) {
      toast.error('Failed to load resumes');
      console.error(error);
      setResumes([]);
      setFilteredResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    try {
      const duplicated = await resumeApi.duplicateResume(resume.id!);
      setResumes([duplicated, ...resumes]);
      toast.success('Resume duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate resume');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!resumeToDelete?.id) return;

    try {
      await resumeApi.deleteResume(resumeToDelete.id);
      setResumes(resumes.filter((r) => r.id !== resumeToDelete.id));
      toast.success('Resume deleted successfully');
    } catch (error) {
      toast.error('Failed to delete resume');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  const openDeleteDialog = (resume: Resume) => {
    setResumeToDelete(resume);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Resumes</CardTitle>
              <CardDescription>Manage your resume documents</CardDescription>
            </div>
            <Button onClick={onCreateResume}>
              <Plus className="h-4 w-4 mr-2" />
              New Resume
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Resume Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No resumes found' : 'No resumes yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first resume to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={onCreateResume}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Resume
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResumes.map((resume) => (
                <Card
                  key={resume.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onSelectResume(resume)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{resume.title}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {resume.personalInfo.fullName}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onSelectResume(resume);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(resume);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(resume);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Updated {formatDistanceToNow(new Date(resume.updatedAt))} ago
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {resume.template}
                      </Badge>
                      {resume.metadata?.targetRole && (
                        <Badge variant="outline" className="text-xs">
                          {resume.metadata.targetRole}
                        </Badge>
                      )}
                      {resume.aiScore && (
                        <Badge
                          variant="default"
                          className={
                            resume.aiScore.overall >= 80
                              ? 'bg-green-600'
                              : resume.aiScore.overall >= 60
                              ? 'bg-blue-600'
                              : 'bg-yellow-600'
                          }
                        >
                          Score: {Math.round(resume.aiScore.overall)}
                        </Badge>
                      )}
                    </div>

                    <div className="h-20 border rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                      Preview
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{resumeToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

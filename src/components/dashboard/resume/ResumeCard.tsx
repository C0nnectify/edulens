'use client';

import React, { useState } from 'react';
import {
  FileText,
  Star,
  MoreVertical,
  Edit,
  Copy,
  Download,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Resume, IndustryCategory } from '@/types/resume';
import { cn } from '@/lib/utils';

interface ResumeCardProps {
  resume: Resume;
  onEdit: (resumeId: string) => void;
  onDuplicate: (resumeId: string) => void;
  onDelete: (resumeId: string) => void;
  onToggleFavorite: (resumeId: string) => void;
  onExport?: (resumeId: string, format: 'pdf' | 'docx') => void;
}

export function ResumeCard({
  resume,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onExport,
}: ResumeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const atsScore = resume.metadata?.atsScore || 0;
  const isFavorite = resume.metadata?.isFavorite || false;

  const getATSScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (score >= 75) return { label: 'Good', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    if (score >= 60) return { label: 'Fair', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { label: 'Needs Work', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  };

  const atsInfo = getATSScoreBadge(atsScore);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200 relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-lg truncate mb-1">{resume.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated {formatDate(resume.updatedAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 transition-colors',
                  isFavorite && 'text-yellow-500 hover:text-yellow-600'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(resume.id || resume._id!);
                }}
              >
                <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(resume.id || resume._id!)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(resume.id || resume._id!)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onExport && (
                    <>
                      <DropdownMenuItem onClick={() => onExport(resume.id || resume._id!, 'pdf')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExport(resume.id || resume._id!, 'docx')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as DOCX
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Mini Preview/Thumbnail */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-3 border border-slate-200 dark:border-slate-800 h-32 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               onClick={() => onEdit(resume.id || resume._id!)}>
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p className="text-xs text-muted-foreground">Click to edit</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            {resume.industryTarget && (
              <Badge variant="secondary" className="text-xs">
                {resume.industryTarget}
              </Badge>
            )}

            {atsScore > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ATS Score</span>
                <Badge className={cn('text-xs', atsInfo.className)}>
                  {atsScore}% - {atsInfo.label}
                </Badge>
              </div>
            )}

            {resume.metadata?.tags && resume.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {resume.metadata.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {resume.metadata.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{resume.metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <Button
            className="w-full"
            onClick={() => onEdit(resume.id || resume._id!)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Resume
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{resume.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(resume.id || resume._id!)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

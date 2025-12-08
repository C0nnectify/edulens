'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import {
  Clock,
  RotateCcw,
  Trash2,
  Tag,
  History,
  AlertCircle,
  CheckCircle2,
  GitCompare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useResumeStore, selectRecentVersions } from '@/store/resumeStore';

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore?: (versionId: string) => void;
  className?: string;
}

export function VersionHistory({
  open,
  onOpenChange,
  onRestore,
  className,
}: VersionHistoryProps) {
  const versions = useResumeStore(selectRecentVersions);
  const restoreVersion = useResumeStore((state) => state.restoreVersion);
  const deleteVersion = useResumeStore((state) => state.deleteVersion);
  const saveVersion = useResumeStore((state) => state.saveVersion);

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [showNewVersion, setShowNewVersion] = useState(false);

  const handleRestore = (versionId: string) => {
    restoreVersion(versionId);
    if (onRestore) {
      onRestore(versionId);
    }
    onOpenChange(false);
  };

  const handleDelete = (versionId: string) => {
    deleteVersion(versionId);
    setDeleteConfirmId(null);
  };

  const handleSaveVersion = () => {
    saveVersion(newVersionLabel);
    setNewVersionLabel('');
    setShowNewVersion(false);
  };

  const handleCompare = (versionId: string) => {
    if (compareVersion === versionId) {
      setCompareVersion(null);
    } else {
      setCompareVersion(versionId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-w-4xl max-h-[85vh]', className)}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <DialogTitle>Version History</DialogTitle>
                  <DialogDescription>
                    Restore or compare previous versions of your resume
                  </DialogDescription>
                </div>
              </div>
              <Button
                onClick={() => setShowNewVersion(!showNewVersion)}
                size="sm"
                variant="outline"
              >
                Save New Version
              </Button>
            </div>
          </DialogHeader>

          {/* Save New Version */}
          {showNewVersion && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Save Current State</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Version label (optional)"
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                />
                <Button onClick={handleSaveVersion} size="sm">
                  Save
                </Button>
                <Button
                  onClick={() => setShowNewVersion(false)}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Version List */}
          <ScrollArea className="h-[50vh]">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Version History</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Version history will appear here as you make changes. Click
                  &quot;Save New Version&quot; to create your first version.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => {
                  const isSelected = selectedVersion === version.id;
                  const isComparing = compareVersion === version.id;

                  return (
                    <div
                      key={version.id}
                      className={cn(
                        'border rounded-lg p-4 transition-all',
                        isSelected && 'ring-2 ring-primary',
                        isComparing && 'ring-2 ring-orange-500'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {version.label || `Version ${versions.length - index}`}
                            </h4>
                            {version.tag && (
                              <Badge variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {version.tag}
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Latest
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(version.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                              {new Date(version.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCompare(version.id)}
                            size="sm"
                            variant={isComparing ? 'default' : 'outline'}
                            title="Compare"
                          >
                            <GitCompare className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleRestore(version.id)}
                            size="sm"
                            variant="outline"
                            disabled={index === 0}
                            title="Restore this version"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteConfirmId(version.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete version"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Version Preview */}
                      <div className="bg-muted/50 rounded p-3 space-y-2 text-xs">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-muted-foreground mb-1">Template</p>
                            <p className="font-medium capitalize">
                              {version.resume.template}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Experience</p>
                            <p className="font-medium">
                              {version.resume.experience?.length || 0} entries
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Skills</p>
                            <p className="font-medium">
                              {version.resume.skills?.length || 0} skills
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold">{versions.length}</span> version
                {versions.length !== 1 && 's'} saved (max 20)
              </div>
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle>Delete Version</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
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

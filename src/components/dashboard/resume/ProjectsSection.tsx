'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types/resume';
import { FolderGit2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';

interface ProjectsSectionProps {
  data: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsSection({ data, onChange }: ProjectsSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set([data[0]?.id]));
  const { draggedIndex, handleDragStart, handleDragOver, handleDragEnd } = useDragDrop(data, onChange);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: [],
    };
    onChange([...data, newProject]);
    setOpenItems(prev => new Set([...prev, newProject.id]));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    onChange(data.map(proj => (proj.id === id ? { ...proj, ...updates } : proj)));
  };

  const removeProject = (id: string) => {
    onChange(data.filter(proj => proj.id !== id));
    setOpenItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderGit2 className="h-5 w-5" />
          Projects
        </CardTitle>
        <CardDescription>
          Showcase your personal and professional projects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((project, index) => {
          const isOpen = openItems.has(project.id);

          return (
            <div
              key={project.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded-lg transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2 p-3 bg-muted/50">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <button
                  type="button"
                  onClick={() => toggleItem(project.id)}
                  className="flex-1 flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="font-medium">{project.name || 'New Project'}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {project.description || 'No description'}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProject(project.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {isOpen && (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input
                      value={project.name}
                      onChange={(e) => updateProject(project.id, { name: e.target.value })}
                      placeholder="My Awesome Project"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={project.description}
                      onChange={(e) => updateProject(project.id, { description: e.target.value })}
                      placeholder="Brief description of the project and your role"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={project.role || ''}
                      onChange={(e) => updateProject(project.id, { role: e.target.value })}
                      placeholder="Lead Developer, Team Member, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project URL</Label>
                      <Input
                        value={project.url || ''}
                        onChange={(e) => updateProject(project.id, { url: e.target.value })}
                        placeholder="https://project-demo.com"
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <Input
                        value={project.github || project.githubUrl || ''}
                        onChange={(e) => updateProject(project.id, { github: e.target.value })}
                        placeholder="https://github.com/username/project"
                        type="url"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Technologies Used (comma-separated)</Label>
                    <Input
                      value={project.technologies.join(', ')}
                      onChange={(e) =>
                        updateProject(project.id, {
                          technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="React, TypeScript, Node.js, MongoDB"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.technologies.map((tech, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button type="button" onClick={addProject} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </CardContent>
    </Card>
  );
}

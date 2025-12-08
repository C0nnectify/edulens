'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FolderOpen, Edit2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Resume, Project } from '@/types/resume';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  role: z.string().optional(),
  technologies: z.string().min(1, 'Technologies are required'),
  achievements: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectsFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
  onComplete?: () => void;
}

export default function ProjectsForm({ resume, onUpdate }: ProjectsFormProps) {
  const [projects, setProjects] = useState<Project[]>(resume.projects || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      role: '',
      technologies: '',
      achievements: '',
      url: '',
      github: '',
    },
  });

  const handleAddProject = () => {
    form.reset();
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditProject = (index: number) => {
    const project = projects[index];
    form.reset({
      name: project.name,
      description: project.description,
      role: project.role || '',
      technologies: project.technologies.join(', '),
      achievements: project.achievements?.join('\n') || project.bullets?.join('\n') || '',
      url: project.url || '',
      github: project.github || project.githubUrl || '',
    });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDeleteProject = (index: number) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
    onUpdate({ projects: newProjects });
  };

  const onSubmit = (data: ProjectFormData) => {
    const newProject: Project = {
      id: editingIndex !== null ? projects[editingIndex].id : `project-${Date.now()}`,
      name: data.name,
      description: data.description,
      role: data.role,
      technologies: data.technologies.split(',').map((t) => t.trim()).filter((t) => t),
      achievements: data.achievements ? data.achievements.split('\n').filter((a) => a.trim()) : [],
      bullets: data.achievements ? data.achievements.split('\n').filter((a) => a.trim()) : [],
      url: data.url,
      github: data.github,
      githubUrl: data.github,
    };

    let newProjects: Project[];
    if (editingIndex !== null) {
      newProjects = projects.map((p, i) => (i === editingIndex ? newProject : p));
    } else {
      newProjects = [...projects, newProject];
    }

    setProjects(newProjects);
    onUpdate({ projects: newProjects });
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Projects
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Showcase your portfolio projects and contributions
            </p>
          </div>
          <Button onClick={handleAddProject}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        <AnimatePresence>
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No projects added yet</p>
              <p className="text-sm mt-1">Add projects to demonstrate your skills</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <h4 className="font-semibold text-lg">{project.name}</h4>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {project.role && (
                          <p className="text-sm text-muted-foreground">{project.role}</p>
                        )}
                        <p className="text-sm mt-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.technologies.map((tech, i) => (
                            <Badge key={i} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            View on GitHub →
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Project' : 'Add Project'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="E-Commerce Platform" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Lead Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the project and its purpose"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technologies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technologies Used *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="React, Node.js, MongoDB, AWS"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Separate technologies with commas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Achievements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• Implemented payment processing system&#10;• Achieved 99.9% uptime&#10;• Reduced load time by 50%"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>One achievement per line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub Repository</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/username/project"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? 'Update' : 'Add'} Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

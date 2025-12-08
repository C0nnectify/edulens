'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Award, Edit2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Resume, Certification } from '@/types/resume';
import { format } from 'date-fns';

const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

interface CertificationsFormProps {
  resume: Resume;
  onUpdate: (updates: Partial<Resume>) => void;
}

export default function CertificationsForm({ resume, onUpdate }: CertificationsFormProps) {
  const [certifications, setCertifications] = useState<Certification[]>(
    resume.certifications || []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialId: '',
      url: '',
    },
  });

  const onSubmit = (data: CertificationFormData) => {
    const newCert: Certification = {
      id: editingIndex !== null ? certifications[editingIndex].id : `cert-${Date.now()}`,
      name: data.name,
      issuer: data.issuer,
      date: data.date,
      expiryDate: data.expiryDate,
      credentialId: data.credentialId,
      url: data.url,
    };

    let newCertifications: Certification[];
    if (editingIndex !== null) {
      newCertifications = certifications.map((c, i) => (i === editingIndex ? newCert : c));
    } else {
      newCertifications = [...certifications, newCert];
    }

    setCertifications(newCertifications);
    onUpdate({ certifications: newCertifications });
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add professional certifications and licenses
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>

        <AnimatePresence>
          {certifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No certifications added yet</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-4">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{cert.name}</h4>
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                        <p className="text-sm mt-1">
                          Issued: {cert.date instanceof Date ? format(cert.date, 'MMM yyyy') : cert.date}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.reset({
                              name: cert.name,
                              issuer: cert.issuer,
                              date: cert.date instanceof Date ? format(cert.date, 'yyyy-MM') : cert.date,
                              expiryDate: cert.expiryDate ? (cert.expiryDate instanceof Date ? format(cert.expiryDate, 'yyyy-MM') : cert.expiryDate) : '',
                              credentialId: cert.credentialId || '',
                              url: cert.url || '',
                            });
                            setEditingIndex(index);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newCerts = certifications.filter((_, i) => i !== index);
                            setCertifications(newCerts);
                            onUpdate({ certifications: newCerts });
                          }}
                          className="text-destructive"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Certification' : 'Add Certification'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="AWS Certified Solutions Architect" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization *</FormLabel>
                    <FormControl>
                      <Input placeholder="Amazon Web Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date *</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://credentials.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? 'Update' : 'Add'} Certification
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

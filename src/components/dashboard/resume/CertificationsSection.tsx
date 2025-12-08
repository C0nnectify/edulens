'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Certification } from '@/types/resume';
import { Award, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';

interface CertificationsSectionProps {
  data: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export function CertificationsSection({ data, onChange }: CertificationsSectionProps) {
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

  const addCertification = () => {
    const newCert: Certification = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
      date: '',
    };
    onChange([...data, newCert]);
    setOpenItems(prev => new Set([...prev, newCert.id]));
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    onChange(data.map(cert => (cert.id === id ? { ...cert, ...updates } : cert)));
  };

  const removeCertification = (id: string) => {
    onChange(data.filter(cert => cert.id !== id));
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
          <Award className="h-5 w-5" />
          Certifications
        </CardTitle>
        <CardDescription>
          Add your professional certifications and licenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((cert, index) => {
          const isOpen = openItems.has(cert.id);

          return (
            <div
              key={cert.id}
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
                  onClick={() => toggleItem(cert.id)}
                  className="flex-1 flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="font-medium">{cert.name || 'New Certification'}</div>
                    <div className="text-sm text-muted-foreground">{cert.issuer || 'Issuer'}</div>
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
                  onClick={() => removeCertification(cert.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {isOpen && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Certification Name *</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                        placeholder="AWS Certified Solutions Architect"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Issuing Organization *</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                        placeholder="Amazon Web Services"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Date *</Label>
                      <Input
                        type="month"
                        value={cert.date as string}
                        onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        type="month"
                        value={cert.expiryDate as string || ''}
                        onChange={(e) => updateCertification(cert.id, { expiryDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Credential ID</Label>
                      <Input
                        value={cert.credentialId || ''}
                        onChange={(e) => updateCertification(cert.id, { credentialId: e.target.value })}
                        placeholder="CERT-123456"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Verification URL</Label>
                      <Input
                        value={cert.url || ''}
                        onChange={(e) => updateCertification(cert.id, { url: e.target.value })}
                        placeholder="https://verify.example.com/cert123"
                        type="url"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button type="button" onClick={addCertification} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </CardContent>
    </Card>
  );
}

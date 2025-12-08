'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Search,
  Download,
  Upload,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface DocumentRequirement {
  type: string;
  name: string;
  required: boolean;
  formats: string[];
  maxSizeMB?: number;
  maxPages?: number;
  wordCountMax?: number;
  instructions?: string;
}

interface UniversityRequirements {
  id?: string;
  universityId: string;
  universityName: string;
  degreeLevel: string;
  documents: DocumentRequirement[];
  specialInstructions?: string;
  scrapedAt?: string;
}

export default function RequirementsManagementPage() {
  const [requirements, setRequirements] = useState<UniversityRequirements[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<UniversityRequirements | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<UniversityRequirements>({
    universityId: '',
    universityName: '',
    degreeLevel: 'graduate',
    documents: [],
    specialInstructions: '',
  });

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/universities/requirements');
      const result = await response.json();

      if (result.success) {
        setRequirements(result.data);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requirements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRequirement
        ? `/api/universities/${editingRequirement.universityId}/requirements`
        : '/api/universities/requirements';

      const response = await fetch(url, {
        method: editingRequirement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Requirements ${editingRequirement ? 'updated' : 'created'} successfully`,
        });
        setIsAddModalOpen(false);
        setEditingRequirement(null);
        resetForm();
        loadRequirements();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to save requirements',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (universityId: string) => {
    if (!confirm('Are you sure you want to delete these requirements?')) return;

    try {
      const response = await fetch(`/api/universities/${universityId}/requirements`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Requirements deleted successfully',
        });
        loadRequirements();
      }
    } catch (error) {
      console.error('Error deleting requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete requirements',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (requirement: UniversityRequirements) => {
    setEditingRequirement(requirement);
    setFormData(requirement);
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      universityId: '',
      universityName: '',
      degreeLevel: 'graduate',
      documents: [],
      specialInstructions: '',
    });
  };

  const addDocument = () => {
    setFormData({
      ...formData,
      documents: [
        ...formData.documents,
        {
          type: 'sop',
          name: '',
          required: true,
          formats: ['PDF'],
          maxSizeMB: 5,
        },
      ],
    });
  };

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    });
  };

  const updateDocument = (index: number, field: string, value: any) => {
    const updatedDocuments = [...formData.documents];
    updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
    setFormData({ ...formData, documents: updatedDocuments });
  };

  const filteredRequirements = requirements.filter((req) =>
    req.universityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requirements...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">University Requirements</h1>
            <p className="text-gray-600 mt-2">
              Manage document requirements for different universities
            </p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Requirements
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRequirement ? 'Edit Requirements' : 'Add New Requirements'}
                </DialogTitle>
                <DialogDescription>
                  Set up document requirements for a university program
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="universityName">University Name</Label>
                    <Input
                      id="universityName"
                      value={formData.universityName}
                      onChange={(e) =>
                        setFormData({ ...formData, universityName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="degreeLevel">Degree Level</Label>
                    <Select
                      value={formData.degreeLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, degreeLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="postdoc">Postdoc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Document Requirements</Label>
                    <Button type="button" onClick={addDocument} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.documents.map((doc, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Document Type</Label>
                              <Select
                                value={doc.type}
                                onValueChange={(value) => updateDocument(index, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sop">Statement of Purpose</SelectItem>
                                  <SelectItem value="resume">Resume/CV</SelectItem>
                                  <SelectItem value="transcript">Transcript</SelectItem>
                                  <SelectItem value="lor">Letter of Recommendation</SelectItem>
                                  <SelectItem value="test_scores">Test Scores</SelectItem>
                                  <SelectItem value="portfolio">Portfolio</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Display Name</Label>
                              <Input
                                value={doc.name}
                                onChange={(e) => updateDocument(index, 'name', e.target.value)}
                                placeholder="e.g., Personal Statement"
                              />
                            </div>
                            <div>
                              <Label>Max Size (MB)</Label>
                              <Input
                                type="number"
                                value={doc.maxSizeMB || ''}
                                onChange={(e) =>
                                  updateDocument(index, 'maxSizeMB', parseInt(e.target.value))
                                }
                                placeholder="5"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={doc.required}
                                  onChange={(e) =>
                                    updateDocument(index, 'required', e.target.checked)
                                  }
                                  className="rounded"
                                />
                                <span className="text-sm">Required</span>
                              </label>
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeDocument(index)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {formData.documents.length === 0 && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No document requirements added</p>
                        <p className="text-sm mt-1">Click "Add Document" to get started</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, specialInstructions: e.target.value })
                    }
                    placeholder="Any special requirements or notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingRequirement(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRequirement ? 'Update' : 'Create'} Requirements
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{requirements.length}</p>
              <p className="text-sm text-gray-600">Total Universities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {requirements.reduce((acc, r) => acc + r.documents.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {requirements.filter((r) => r.scrapedAt).length}
              </p>
              <p className="text-sm text-gray-600">Auto-Scraped</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search universities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredRequirements.map((requirement) => (
            <Card key={requirement.id || requirement.universityId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      {requirement.universityName}
                    </CardTitle>
                    <CardDescription>
                      {requirement.degreeLevel} • {requirement.documents.length} document requirements
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(requirement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(requirement.universityId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requirement.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium">{doc.name || doc.type}</p>
                          <p className="text-xs text-gray-600">
                            {doc.formats.join(', ')} • Max {doc.maxSizeMB}MB
                            {doc.maxPages && ` • Max ${doc.maxPages} pages`}
                          </p>
                        </div>
                      </div>
                      {doc.required ? (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredRequirements.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No requirements found</p>
                <p className="text-sm mt-2">
                  {searchTerm
                    ? 'Try a different search term'
                    : 'Add your first university requirements to get started'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

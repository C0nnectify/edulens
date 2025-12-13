'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Briefcase,
  GraduationCap,
  Scroll,
  Mail,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { listSOPs, listLORs, deleteSOP, type SOPSummary } from './sop-generator/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DocumentBuilderPage() {
  const [documents, setDocuments] = useState<{
    sops: SOPSummary[];
    lors: SOPSummary[];
  }>({ sops: [], lors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const [sops, lors] = await Promise.all([
        listSOPs(10),
        listLORs(10),
      ]);
      setDocuments({ sops, lors });
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'sop' | 'lor') => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteSOP(id);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const documentTypes = [
    {
      title: 'Resume',
      description: 'ATS-optimized resumes for international applications',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/document-builder/resume',
    },
    {
      title: 'CV',
      description: 'Academic CVs for research positions',
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/document-builder/cv',
    },
    {
      title: 'SOP',
      description: 'Compelling statements of purpose',
      icon: Scroll,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/document-builder/sop-generator',
    },
    {
      title: 'LOR',
      description: 'Professional recommendation letters',
      icon: Mail,
      color: 'from-indigo-500 to-indigo-600',
      href: '/dashboard/document-builder/lor-generator',
    },
  ];

  const allDocuments = [
    ...documents.sops.map((doc) => ({ ...doc, type: 'sop' as const })),
    ...documents.lors.map((doc) => ({ ...doc, type: 'lor' as const })),
  ]
    // De-duplicate by id + type in case the API returns overlaps
    .filter((doc, index, self) =>
      index === self.findIndex((d) => d.id === doc.id && d.type === doc.type),
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Document Builder
              </h1>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                AI-Powered
              </Badge>
            </div>
            <p className="text-gray-600 text-base">
              Create professional documents that get you noticed
            </p>
          </div>

          {/* Create New Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Create New
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/document-builder/resume" className="flex items-center cursor-pointer">
                  <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                  Resume
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/document-builder/cv" className="flex items-center cursor-pointer">
                  <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
                  CV
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/document-builder/sop-generator" className="flex items-center cursor-pointer">
                  <Scroll className="h-4 w-4 mr-2 text-green-600" />
                  SOP
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/document-builder/lor-generator" className="flex items-center cursor-pointer">
                  <Mail className="h-4 w-4 mr-2 text-indigo-600" />
                  LOR
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* My Documents Section */}
        {allDocuments.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                My Documents
              </CardTitle>
              <CardDescription>Your recently created documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDocuments.map((doc) => (
                  <Card key={`${doc.type}-${doc.id}`} className="group hover:shadow-lg transition-all duration-200 border border-gray-200">
                    <Link 
                      href={doc.type === 'sop' 
                        ? `/dashboard/document-builder/sop-generator?id=${doc.id}` 
                        : `/dashboard/document-builder/lor-generator?id=${doc.id}`}
                      className="block"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {doc.type === 'sop' ? (
                              <div className="p-2 rounded-lg bg-green-100">
                                <Scroll className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-indigo-100">
                                <Mail className="h-4 w-4 text-indigo-600" />
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {doc.type.toUpperCase()}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link 
                                  href={doc.type === 'sop' 
                                    ? `/dashboard/document-builder/sop-generator?id=${doc.id}` 
                                    : `/dashboard/document-builder/lor-generator?id=${doc.id}`}
                                  className="flex items-center cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(doc.id, doc.type);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {doc.title || 'Untitled Document'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(doc.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Type Cards - Smaller & Minimal */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Document</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {documentTypes.map((doc, index) => (
              <Link key={index} href={doc.href}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 cursor-pointer h-full">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <doc.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{doc.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Why Use Our Document Builder?</h2>
              <p className="text-gray-600">AI-powered tools to create professional documents in minutes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Smart Analysis</h3>
                <p className="text-sm text-gray-600">AI analyzes your profile and generates tailored content</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Save Time</h3>
                <p className="text-sm text-gray-600">Create professional documents in minutes, not hours</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Pencil className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Easy Editing</h3>
                <p className="text-sm text-gray-600">Customize and refine with our intuitive editor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
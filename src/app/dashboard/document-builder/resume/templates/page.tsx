'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Star, Sparkles, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getTemplateCategories } from '@/lib/templates/registry';

export default function TemplatesPage() {
  const router = useRouter();
  const templateCategories = getTemplateCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const allTemplates = templateCategories.flatMap(cat =>
    cat.templates.map(t => ({ ...t, category: cat.category }))
  );

  const filteredTemplates = selectedCategory === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.category === selectedCategory);

  const categories = ['all', ...templateCategories.map(c => c.category)];

  const handleSelectTemplate = async (templateId: string) => {
    // Create a persisted resume using the selected template, then open it in the editor.
    // If creation fails (e.g., auth), fall back to opening the editor with template param.
    setCreateError(null);
    setCreatingTemplateId(templateId);
    try {
      const response = await fetch('/api/resume/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Resume',
          template: templateId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const msg = (data && (data.error || data.message)) || 'Failed to create resume';
        throw new Error(msg);
      }

      const createdId = data?.resume?._id || data?.resume?.id;
      if (createdId) {
        router.push(`/dashboard/document-builder/resume/editor-v2?id=${encodeURIComponent(String(createdId))}`);
      } else {
        router.push(`/dashboard/document-builder/resume/editor-v2?template=${encodeURIComponent(templateId)}`);
      }
    } catch (e: any) {
      setCreateError(e?.message || 'Failed to create resume');
      router.push(`/dashboard/document-builder/resume/editor-v2?template=${encodeURIComponent(templateId)}`);
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative container mx-auto px-4 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">21 Industry-Specific Templates</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Choose Your Perfect Template
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Select from 21 professionally designed, ATS-optimized templates tailored for your industry.
                Each template is crafted to maximize your chances of landing interviews.
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>ATS Score 87-98%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Industry-Specific</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Professional Design</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Templates' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Template Gallery */}
        <div className="container mx-auto px-4 pb-20">
          {createError && (
            <div className="max-w-3xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {createError}
            </div>
          )}
          <div className="mb-8 text-center">
            <p className="text-gray-600">
              Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer relative overflow-hidden h-full">
                  {/* ATS Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      ATS {template.atsScore}%
                    </Badge>
                  </div>

                  {/* Template Preview */}
                  <div className="relative aspect-[8.5/11] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-24 w-24 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="lg"
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        onClick={() => handleSelectTemplate(template.id)}
                        disabled={creatingTemplateId === template.id}
                      >
                        {creatingTemplateId === template.id ? 'Creating…' : 'Use This Template'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* ATS Score Bar */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">ATS Compatibility</span>
                        <span className="text-sm font-bold text-blue-600">{template.atsScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${template.atsScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Required Sections */}
                    {template.requiredSections && template.requiredSections.length > 0 && (
                      <div className="space-y-1 mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Included Sections:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.requiredSections.slice(0, 3).map((section, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {section.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                          ))}
                          {template.requiredSections.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.requiredSections.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      onClick={() => handleSelectTemplate(template.id)}
                      disabled={creatingTemplateId === template.id}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {creatingTemplateId === template.id ? 'Creating…' : 'Create Resume'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

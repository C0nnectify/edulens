'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Info,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImportedApplication {
  universityName: string;
  programName: string;
  degreeLevel: string;
  deadline?: string;
  applicationFee?: number;
  priority?: string;
  status?: string;
  notes?: string;
}

interface ImportResult {
  imported: Array<{
    id: string;
    universityName: string;
    programName: string;
  }>;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export default function ImportApplicationsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<'csv' | 'excel' | 'commonapp'>('csv');
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedApplication[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Parse and preview the file
      if (importSource === 'csv' || importSource === 'excel') {
        await parseFile(file);
      }
    }
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');

      if (lines.length < 2) {
        toast({
          title: 'Error',
          description: 'File must contain header row and at least one data row',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const data: ImportedApplication[] = [];

      for (let i = 1; i < Math.min(6, lines.length); i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        data.push({
          universityName: row.universityName || row['University Name'] || '',
          programName: row.programName || row['Program Name'] || '',
          degreeLevel: row.degreeLevel || row['Degree Level'] || '',
          deadline: row.deadline || row['Deadline'] || undefined,
          applicationFee: row.applicationFee ? parseFloat(row.applicationFee) : undefined,
          priority: row.priority || row['Priority'] || undefined,
          status: row.status || row['Status'] || 'draft',
          notes: row.notes || row['Notes'] || undefined,
        });
      }

      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse file. Please check the format.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to import',
        variant: 'destructive',
      });
      return;
    }

    try {
      setImporting(true);
      const text = await selectedFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());
      const data: ImportedApplication[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        data.push({
          universityName: row.universityName || row['University Name'] || '',
          programName: row.programName || row['Program Name'] || '',
          degreeLevel: row.degreeLevel || row['Degree Level'] || '',
          deadline: row.deadline || row['Deadline'] || undefined,
          applicationFee: row.applicationFee ? parseFloat(row.applicationFee) : undefined,
          priority: row.priority || row['Priority'] || undefined,
          status: row.status || row['Status'] || 'draft',
          notes: row.notes || row['Notes'] || undefined,
        });
      }

      const response = await fetch('/api/applications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: importSource,
          data: data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        toast({
          title: 'Success',
          description: `Successfully imported ${result.data.successful} of ${result.data.total} applications`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error importing applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to import applications',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setShowPreview(false);
  };

  const downloadTemplate = (type: 'csv' | 'excel') => {
    const csvContent = `universityName,programName,degreeLevel,deadline,applicationFee,priority,status,notes
MIT,MS in Computer Science,graduate,2025-02-01,75,high,draft,Regular admission
Stanford University,MS in Artificial Intelligence,graduate,2025-01-15,90,high,draft,Early deadline
Harvard University,MBA,graduate,2025-03-01,100,medium,draft,Business program`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application_import_template.${type}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Applications</h1>
          <p className="text-gray-600 mt-2">
            Bulk import your applications from CSV, Excel, or CommonApp
          </p>
        </div>

        {/* Import Result */}
        {importResult && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-6 w-6" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{importResult.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{importResult.successful}</p>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-900 mb-2">Import Errors:</p>
                  <div className="space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        Row {error.row}: {error.field} - {error.message}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-sm text-red-700">
                        And {importResult.errors.length - 5} more errors...
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => router.push('/dashboard/application-tracker')}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Applications
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Import More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Card */}
        {!importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Select Import Source</CardTitle>
              <CardDescription>
                Choose your import method and upload your file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={importSource} onValueChange={(v) => setImportSource(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="csv">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="excel">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </TabsTrigger>
                  <TabsTrigger value="commonapp">
                    <Globe className="h-4 w-4 mr-2" />
                    CommonApp
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-900 font-medium">CSV Format</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Upload a CSV file with columns: universityName, programName, degreeLevel,
                          deadline, applicationFee, priority, status, notes
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-blue-600 p-0 h-auto mt-2"
                          onClick={() => downloadTemplate('csv')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="csv-file">Upload CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="excel" className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-900 font-medium">Excel Format</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Upload an Excel file (.xlsx) with the same columns as CSV format
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-blue-600 p-0 h-auto mt-2"
                          onClick={() => downloadTemplate('excel')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excel-file">Upload Excel File</Label>
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="commonapp" className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-900 font-medium">Coming Soon</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          CommonApp integration is currently in development. Please use CSV or Excel
                          import for now.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {showPreview && previewData.length > 0 && !importResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Data</CardTitle>
                  <CardDescription>
                    Review the first 5 rows before importing (showing {previewData.length} of {previewData.length})
                  </CardDescription>
                </div>
                <Badge variant="outline">{previewData.length} rows</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>University</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Degree Level</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((app, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{app.universityName}</TableCell>
                        <TableCell>{app.programName}</TableCell>
                        <TableCell>{app.degreeLevel}</TableCell>
                        <TableCell>{app.deadline || '-'}</TableCell>
                        <TableCell>{app.applicationFee ? `$${app.applicationFee}` : '-'}</TableCell>
                        <TableCell>
                          {app.priority && (
                            <Badge variant="outline">{app.priority}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {app.status && (
                            <Badge variant="secondary">{app.status}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importing ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Applications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Download Template</p>
                    <p className="text-sm text-gray-600">
                      Download the CSV or Excel template to see the required format
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Fill in Your Data</p>
                    <p className="text-sm text-gray-600">
                      Add your application information to the template. Required fields: universityName,
                      programName, degreeLevel
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload and Preview</p>
                    <p className="text-sm text-gray-600">
                      Upload your file and review the preview to ensure all data is correct
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Import</p>
                    <p className="text-sm text-gray-600">
                      Click the Import button to add all applications to your tracker
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

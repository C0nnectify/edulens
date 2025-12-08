'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Edit3, 
  Eye, 
  Printer, 
  Share2, 
  Copy,
  CheckCircle,
  AlertCircle,
  Target,
  Users,
  Award
} from 'lucide-react';

interface SOPPreviewProps {
  content: string;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

export default function SOPPreview({ content, onEdit, onRegenerate }: SOPPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = content.length;
  const paragraphCount = content.split('\n\n').filter(para => para.trim().length > 0).length;

  const getWordCountStatus = () => {
    if (wordCount < 500) return { status: 'Too Short', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (wordCount > 1200) return { status: 'Too Long', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'Good Length', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const wordCountStatus = getWordCountStatus();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([editedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'statement-of-purpose.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printSOP = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Statement of Purpose</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1, h2, h3 { color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Statement of Purpose</h1>
            </div>
            <div>${editedContent.replace(/\n/g, '<br>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <CardTitle>Statement of Purpose Preview</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${wordCountStatus.bgColor} ${wordCountStatus.color} border-0`}>
                {wordCountStatus.status}
              </Badge>
              <Badge variant="outline">
                {wordCount} words
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{characterCount}</div>
              <div className="text-sm text-gray-600">Characters</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{paragraphCount}</div>
              <div className="text-sm text-gray-600">Paragraphs</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(characterCount / 5)} min
              </div>
              <div className="text-sm text-gray-600">Read Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAsText}
            >
              <Download className="h-4 w-4 mr-2" />
              Download TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printSOP}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
              >
                <Target className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Display/Edit */}
      <Card>
        <CardContent className="p-0">
          {isEditing ? (
            <div className="p-6">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[600px] resize-none border-0 focus:ring-0 text-sm leading-relaxed"
                placeholder="Start writing your statement of purpose..."
              />
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle save logic here
                    setIsEditing(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {editedContent}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Tips and Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span>Writing Tips & Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Content Structure</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Start with a compelling introduction</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Include specific examples and achievements</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Connect your goals to the program</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>End with a strong conclusion</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Best Practices</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Use active voice and clear language</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Avoid clichés and generic statements</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Proofread for grammar and spelling</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Keep it concise and focused</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

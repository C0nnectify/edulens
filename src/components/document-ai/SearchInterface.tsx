/**
 * Search Interface Component
 */

'use client';

import { useState } from 'react';
import { Search, Filter, Sparkles, FileText } from 'lucide-react';
import { useDocumentSearch } from '@/hooks/useDocumentAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SearchInterface() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword' | 'hybrid'>('semantic');
  const [scope, setScope] = useState<'collection' | 'document'>('collection');
  const [groupByDoc, setGroupByDoc] = useState(false);

  const { results, groupedResults, searching, error, query: performQuery } = useDocumentSearch();

  const handleSearch = async () => {
    if (!query.trim()) return;

    await performQuery({
      query,
      scope,
      mode: searchMode,
      topK: 20,
      groupByDocument: groupByDoc,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Search
          </CardTitle>
          <CardDescription>
            Search across your documents using semantic, keyword, or hybrid search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask anything about your documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Search Mode</label>
              <Select value={searchMode} onValueChange={(value: any) => setSearchMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semantic">Semantic (AI-powered)</SelectItem>
                  <SelectItem value="keyword">Keyword (Exact match)</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Best results)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Search Scope</label>
              <Select value={scope} onValueChange={(value: any) => setScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collection">All Documents</SelectItem>
                  <SelectItem value="document">Specific Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant={groupByDoc ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupByDoc(!groupByDoc)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Group by Doc
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {(results.length > 0 || groupedResults.length > 0) && (
        <Tabs defaultValue={groupByDoc ? 'grouped' : 'results'}>
          <TabsList>
            <TabsTrigger value="results">
              Results ({results.length})
            </TabsTrigger>
            {groupByDoc && (
              <TabsTrigger value="grouped">
                By Document ({groupedResults.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="results" className="space-y-2 mt-4">
            {results.map((result, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{result.filename}</span>
                      </div>
                      <Badge variant="secondary">
                        Score: {result.score.toFixed(4)}
                      </Badge>
                    </div>

                    <p className="text-sm">{result.text}</p>

                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Chunk {result.chunk_index + 1}</span>
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>Tags: {result.tags.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {groupByDoc && (
            <TabsContent value="grouped" className="space-y-4 mt-4">
              {groupedResults.map((group, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {group.filename}
                      </span>
                      <Badge>
                        Max: {group.max_score.toFixed(4)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {group.chunks.length} matching chunk{group.chunks.length !== 1 ? 's' : ''} •
                      Avg score: {group.avg_score.toFixed(4)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.chunks.slice(0, 3).map((chunk: any, cidx: number) => (
                      <div key={cidx} className="p-3 bg-accent/30 rounded-md">
                        <p className="text-sm">{chunk.text}</p>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>Chunk {chunk.chunk_index + 1}</span>
                          <span>Score: {chunk.score.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                    {group.chunks.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{group.chunks.length - 3} more chunk{group.chunks.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Empty State */}
      {!searching && results.length === 0 && groupedResults.length === 0 && query && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="mx-auto h-12 w-12 mb-2" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term or mode</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

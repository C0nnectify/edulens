# Query API Guide

## Overview

The Query API provides flexible querying capabilities across your document collection with three scopes:

1. **Collection** - Query across all user documents
2. **Document** - Query within a specific document
3. **Tracking IDs** - Query across multiple documents by their tracking_id

## API Endpoints

### 1. Universal Query Endpoint

**`POST /api/query`**

The main query endpoint supporting all scope types.

#### Request Body

```typescript
{
  query: string;                    // Required: Query text
  scope: 'collection' | 'document' | 'tracking_ids';  // Default: 'collection'

  // For scope='document'
  document_id?: string;

  // For scope='tracking_ids'
  tracking_ids?: string[];

  // Search options
  mode: 'semantic' | 'keyword' | 'hybrid';  // Default: 'semantic'
  top_k?: number;                   // Default: 10, max: 100

  // Filters
  tags?: string[];
  min_score?: number;               // 0.0 to 1.0

  // Response options
  group_by_document?: boolean;      // Default: false
  include_metadata?: boolean;       // Default: true
}
```

#### Response

```typescript
{
  results: SearchResult[];          // Array of matching chunks
  grouped_results?: DocumentGroup[];  // If group_by_document=true
  total: number;                    // Total results count
  query: string;                    // Original query
  scope: string;                    // Scope used
  mode: string;                     // Mode used
  filters_applied: object;          // Applied filters summary
  processing_time_ms: number;       // Processing time
}
```

### 2. Quick Query Endpoints

#### Query Collection

**`POST /api/query/collection`**

Quick endpoint for querying entire user collection.

**Query Parameters:**
- `query` (required) - Query text
- `mode` - 'semantic', 'keyword', or 'hybrid' (default: 'semantic')
- `top_k` - Number of results (default: 10)
- `tags` - JSON array of tags to filter
- `min_score` - Minimum score threshold

**Example:**
```
POST /api/query/collection?query=machine learning&mode=semantic&top_k=20
```

#### Query Document

**`POST /api/query/document/{document_id}`**

Query within a specific document.

**Path Parameters:**
- `document_id` - Document ID

**Query Parameters:**
- `query` (required) - Query text
- `mode` - Search mode
- `top_k` - Number of results
- `min_score` - Minimum score

**Example:**
```
POST /api/query/document/abc-123?query=neural networks&mode=semantic
```

#### Query by Tracking IDs

**`POST /api/query/tracking`**

Query across multiple documents by tracking_id.

**Request Body:**
```json
{
  "tracking_ids": ["track-1", "track-2", "track-3"],
  "query": "deep learning",
  "mode": "semantic",
  "top_k": 15,
  "group_by_document": true,
  "min_score": 0.7
}
```

## Usage Examples

### Example 1: Query Entire Collection

Find information across all your documents:

```typescript
import { aiServiceClient } from '@/lib/ai-service-client';

// Using the main query method
const response = await aiServiceClient.query({
  query: 'machine learning algorithms',
  scope: 'collection',
  mode: 'semantic',
  topK: 10,
  tags: ['research'],
  minScore: 0.5
});

console.log(`Found ${response.total} results`);
response.results.forEach(result => {
  console.log(`${result.filename}: ${result.text} (score: ${result.score})`);
});

// Or use the shorthand method
const response2 = await aiServiceClient.queryCollection(
  'machine learning algorithms',
  {
    mode: 'semantic',
    topK: 10,
    tags: ['research']
  }
);
```

**Use Cases:**
- General knowledge search across all documents
- Finding information without knowing which document contains it
- Discovery of relevant content across your entire library

### Example 2: Query Specific Document

Search within a single document:

```typescript
// Using the main query method
const response = await aiServiceClient.query({
  query: 'neural network architecture',
  scope: 'document',
  documentId: 'doc-abc-123',
  mode: 'semantic',
  topK: 5
});

// Or use the shorthand method
const response2 = await aiServiceClient.queryDocument(
  'doc-abc-123',
  'neural network architecture',
  {
    mode: 'semantic',
    topK: 5
  }
);

console.log(`Found ${response.total} matches in this document`);
```

**Use Cases:**
- Quick reference within a known document
- Extracting specific information from a PDF
- Navigating large documents efficiently

### Example 3: Query Multiple Documents by Tracking ID

Query across related documents:

```typescript
// Query documents with specific tracking IDs
const trackingIds = [
  'track-research-1',
  'track-research-2',
  'track-research-3'
];

const response = await aiServiceClient.queryByTrackingIds(
  trackingIds,
  'gradient descent optimization',
  {
    mode: 'hybrid',
    topK: 20,
    groupByDocument: true,
    minScore: 0.6
  }
);

// Results are grouped by document
if (response.grouped_results) {
  response.grouped_results.forEach(group => {
    console.log(`\nDocument: ${group.filename}`);
    console.log(`Average score: ${group.avg_score}`);
    console.log(`Chunks found: ${group.chunks.length}`);

    group.chunks.forEach(chunk => {
      console.log(`  - ${chunk.text} (${chunk.score})`);
    });
  });
}
```

**Use Cases:**
- Comparing information across related documents
- Multi-document analysis
- Finding patterns across a set of papers/reports

### Example 4: Tag-Based Filtering

Query documents with specific tags:

```typescript
// Find information in documents tagged 'magicfill'
const response = await aiServiceClient.query({
  query: 'education background',
  scope: 'collection',
  mode: 'semantic',
  tags: ['magicfill'],
  topK: 5
});

// Or query with multiple tag filters
const response2 = await aiServiceClient.query({
  query: 'research methodology',
  scope: 'collection',
  tags: ['research', 'academic'],
  mode: 'hybrid'
});
```

### Example 5: Grouped Results

Get results organized by document:

```typescript
const response = await aiServiceClient.query({
  query: 'climate change impact',
  scope: 'collection',
  mode: 'semantic',
  topK: 30,
  groupByDocument: true
});

// Access grouped results
if (response.grouped_results) {
  console.log(`Found matches in ${response.grouped_results.length} documents`);

  response.grouped_results.forEach((group, index) => {
    console.log(`\n${index + 1}. ${group.filename}`);
    console.log(`   Tracking ID: ${group.tracking_id}`);
    console.log(`   Tags: ${group.tags.join(', ')}`);
    console.log(`   Max score: ${group.max_score.toFixed(4)}`);
    console.log(`   Chunks: ${group.chunks.length}`);
  });
}
```

## Search Modes

### Semantic Search (Default)

Uses vector embeddings to find semantically similar content.

```typescript
const response = await aiServiceClient.query({
  query: 'artificial intelligence applications',
  mode: 'semantic'
});
```

**Best for:**
- Conceptual searches
- Finding similar ideas expressed differently
- Understanding context and meaning

### Keyword Search

Traditional text-based search using MongoDB full-text search.

```typescript
const response = await aiServiceClient.query({
  query: 'machine learning',
  mode: 'keyword'
});
```

**Best for:**
- Exact phrase matching
- Finding specific terms
- Technical terms or proper nouns

### Hybrid Search

Combines semantic and keyword search for best results.

```typescript
const response = await aiServiceClient.query({
  query: 'deep learning neural networks',
  mode: 'hybrid'
});
```

**Best for:**
- General purpose search
- Balancing precision and recall
- Complex queries with multiple concepts

## React Component Examples

### Collection Search Component

```typescript
'use client';

import { aiServiceClient } from '@/lib/ai-service-client';
import { useState } from 'react';

export function CollectionSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await aiServiceClient.queryCollection(query, {
        mode: 'semantic',
        topK: 10
      });
      setResults(response.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your documents..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>

      {results.map((result, idx) => (
        <div key={idx}>
          <h4>{result.filename}</h4>
          <p>{result.text}</p>
          <small>Score: {result.score.toFixed(4)}</small>
        </div>
      ))}
    </div>
  );
}
```

### Document-Specific Query Component

```typescript
'use client';

import { aiServiceClient } from '@/lib/ai-service-client';
import { useState } from 'react';

export function DocumentQuery({ documentId }: { documentId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleQuery = async () => {
    const response = await aiServiceClient.queryDocument(
      documentId,
      query,
      { mode: 'semantic', topK: 5 }
    );
    setResults(response.results);
  };

  return (
    <div>
      <h3>Search within this document</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find in document..."
      />
      <button onClick={handleQuery}>Search</button>

      {results.map((result, idx) => (
        <div key={idx}>
          <p>{result.text}</p>
          <small>
            Chunk {result.chunk_index + 1} - Score: {result.score.toFixed(4)}
          </small>
        </div>
      ))}
    </div>
  );
}
```

### Multi-Document Query with Grouping

```typescript
'use client';

import { aiServiceClient } from '@/lib/ai-service-client';
import { useState } from 'react';

export function MultiDocumentQuery({ trackingIds }: { trackingIds: string[] }) {
  const [query, setQuery] = useState('');
  const [groupedResults, setGroupedResults] = useState<any[]>([]);

  const handleQuery = async () => {
    const response = await aiServiceClient.queryByTrackingIds(
      trackingIds,
      query,
      {
        mode: 'hybrid',
        topK: 20,
        groupByDocument: true
      }
    );
    setGroupedResults(response.grouped_results || []);
  };

  return (
    <div>
      <h3>Search across {trackingIds.length} documents</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Query across selected documents..."
      />
      <button onClick={handleQuery}>Query</button>

      {groupedResults.map((group, idx) => (
        <div key={idx}>
          <h4>{group.filename}</h4>
          <p>
            Max score: {group.max_score.toFixed(4)} |
            Chunks: {group.chunks.length}
          </p>
          {group.chunks.slice(0, 3).map((chunk: any, cidx: number) => (
            <div key={cidx}>
              <p>{chunk.text}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Performance Tips

### 1. Use Appropriate top_k Values

```typescript
// For quick lookups
await aiServiceClient.query({ query: 'topic', topK: 5 });

// For comprehensive search
await aiServiceClient.query({ query: 'topic', topK: 50 });
```

### 2. Filter with Tags

```typescript
// Faster: Only search tagged documents
await aiServiceClient.query({
  query: 'info',
  tags: ['magicfill'],
  topK: 10
});
```

### 3. Use Document Scope When Possible

```typescript
// If you know the document, search within it
await aiServiceClient.queryDocument(documentId, 'specific info');
```

### 4. Set Minimum Score Threshold

```typescript
// Filter low-quality results
await aiServiceClient.query({
  query: 'topic',
  minScore: 0.7  // Only return highly relevant results
});
```

## Error Handling

```typescript
try {
  const response = await aiServiceClient.query({
    query: 'search term',
    scope: 'document',
    documentId: 'abc-123'
  });
} catch (error) {
  if (error.message.includes('document_id is required')) {
    console.error('Missing document ID');
  } else if (error.message.includes('Unauthorized')) {
    console.error('Please login');
  } else {
    console.error('Query failed:', error.message);
  }
}
```

## Summary

The Query API provides three flexible ways to search your documents:

1. **Collection Scope** - Search everything
2. **Document Scope** - Search specific document
3. **Tracking IDs Scope** - Search multiple documents

Features:
- ✅ Three search modes (semantic, keyword, hybrid)
- ✅ Tag-based filtering
- ✅ Score thresholds
- ✅ Result grouping by document
- ✅ Metadata control
- ✅ Fast and efficient

Choose the right scope and mode for your use case!

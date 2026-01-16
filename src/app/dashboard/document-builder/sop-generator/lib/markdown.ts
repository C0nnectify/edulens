const KNOWN_TAG_PATTERN = /<\/?(p|div|strong|em|span|h[1-6]|ul|ol|li|br|section|article)[^>]*>/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function restoreMarkdownHtml(value: string): string {
  let output = value;
  // Bold variations
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Italic variations (single * or _)
  output = output.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  output = output.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');
  // Inline code
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Strikethrough
  output = output.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return output;
}

function convertInlineMarkdown(text: string): string {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const restored = restoreMarkdownHtml(escaped);
  return restored.replace(/\n/g, '<br />');
}

function isLikelyHtml(value: string): boolean {
  return KNOWN_TAG_PATTERN.test(value) || /<\/?[a-z][^>]*>/i.test(value);
}

function convertMarkdownDocument(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) {
      blocks.push(`<p>${convertInlineMarkdown(text)}</p>`);
    }
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems || listItems.items.length === 0) {
      listItems = null;
      return;
    }
    const tag = listItems.type;
    const listHtml = listItems.items.map(item => `<li>${item}</li>`).join('');
    blocks.push(`<${tag}>${listHtml}</${tag}>`);
    listItems = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1].length, 6);
      const content = convertInlineMarkdown(headingMatch[2]);
      blocks.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    if (unorderedMatch) {
      flushParagraph();
      const itemContent = convertInlineMarkdown(unorderedMatch[1]);
      if (!listItems || listItems.type !== 'ul') {
        flushList();
        listItems = { type: 'ul', items: [] };
      }
      listItems.items.push(itemContent);
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      const itemContent = convertInlineMarkdown(orderedMatch[2]);
      if (!listItems || listItems.type !== 'ol') {
        flushList();
        listItems = { type: 'ol', items: [] };
      }
      listItems.items.push(itemContent);
      continue;
    }

    if (paragraph.length > 0) {
      paragraph.push(trimmed);
    } else {
      paragraph = [trimmed];
    }
  }

  flushParagraph();
  flushList();

  return blocks.join('\n');
}

export function normalizeEditorHtml(content: string): string {
  const value = content?.trim() ?? '';
  if (!value) return '';
  return isLikelyHtml(value) ? value : convertMarkdownDocument(value);
}

export function normalizeInlineHtml(content: string): string {
  const value = content ?? '';
  if (!value.trim()) return '';
  return isLikelyHtml(value) ? value : convertInlineMarkdown(value);
}

export function ensureDocumentTitle(html: string, title?: string): string {
  const safeTitle = title?.trim();
  const existing = html?.trim() ?? '';
  if (!safeTitle) {
    return existing;
  }
  if (!existing) {
    return `<h1>${escapeHtml(safeTitle)}</h1>`;
  }
  if (/<h1[\s>]/i.test(existing)) {
    return existing;
  }
  return `<h1>${escapeHtml(safeTitle)}</h1>\n${existing}`;
}

type TipTapMark = { type: string; attrs?: Record<string, unknown> };
export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown> & { level?: number };
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
};

type TipTapDoc = { content?: TipTapNode[] } & Record<string, unknown>;

interface JsonTitleOptions {
  level?: number;
  textAlign?: string;
  lineHeight?: string;
  fontSize?: string;
  fontFamily?: string;
}

export function ensureEditorJsonTitle(
  json: Record<string, unknown>,
  title: string,
  options: JsonTitleOptions = {}
): Record<string, unknown> {
  const safeTitle = title?.trim();
  if (!safeTitle) {
    return json;
  }

  const clone = JSON.parse(JSON.stringify(json)) as TipTapDoc;
  const nodes = Array.isArray(clone.content) ? clone.content : [];
  const targetLevel = options.level ?? 1;
  const existingHeading = nodes.find((node) => {
    if (node?.type !== 'heading') return false;
    const level = (node.attrs?.level as number | undefined) ?? 1;
    if (level !== targetLevel) return false;
    const text = (node.content || [])
      .map((inner) => (inner.text ?? '').trim())
      .join('');
    return text.length > 0;
  });

  if (existingHeading) {
    return clone;
  }

  const markAttrs: Record<string, unknown> = {};
  if (options.fontSize) markAttrs.fontSize = options.fontSize;
  if (options.fontFamily) markAttrs.fontFamily = options.fontFamily;

  const titleNode: TipTapNode = {
    type: 'heading',
    attrs: {
      level: targetLevel,
      textAlign: options.textAlign ?? 'center',
      lineHeight: options.lineHeight ?? '1.5',
    },
    content: [
      {
        type: 'text',
        text: safeTitle,
        marks: Object.keys(markAttrs).length > 0
          ? [
              {
                type: 'textStyle',
                attrs: markAttrs,
              },
            ]
          : undefined,
      },
    ],
  };

  clone.content = [titleNode, ...nodes];
  return clone;
}

export function convertJsonParagraphText(nodes: { type: string; text?: string }[] | undefined): string {
  if (!nodes) return '';
  return nodes.map(node => node.text ?? '').join('');
}

/**
 * Check if editor JSON has meaningful content (not just a title or empty)
 * Returns false if the document is essentially empty
 */
export function hasMeaningfulContent(json: Record<string, unknown> | null): boolean {
  if (!json) return false;
  const doc = json as TipTapDoc;
  const content = doc.content;
  if (!content || content.length === 0) return false;
  
  // Count paragraphs with actual text (not just empty paragraphs)
  let textLength = 0;
  for (const node of content) {
    if (node.type === 'paragraph' || (node.type === 'heading' && (node.attrs?.level ?? 1) !== 1)) {
      const text = convertJsonParagraphText(node.content).trim();
      textLength += text.length;
    }
  }
  
  // Require at least 50 characters of body text (excluding H1 title)
  return textLength >= 50;
}

export function jsonToHtmlWithMarkdown(json: Record<string, unknown>): string {
  const doc = json as TipTapDoc;
  const nodes = doc.content ?? [];
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.type === 'heading') {
      const level = Math.min(node.attrs?.level ?? 1, 6);
      const text = convertJsonParagraphText(node.content);
      parts.push(`<h${level}>${convertInlineMarkdown(text)}</h${level}>`);
    } else if (node.type === 'paragraph') {
      const text = convertJsonParagraphText(node.content);
      parts.push(`<p>${convertInlineMarkdown(text)}</p>`);
    }
  }

  return parts.join('\n');
}

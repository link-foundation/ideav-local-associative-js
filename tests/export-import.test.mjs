import { describe, it, expect } from 'test-anywhere';
import {
  ExportFormats,
  exportToLinksNotation,
  exportToJSON,
  exportToCSV,
  exportLinks,
  importFromLinksNotation,
  importFromJSON,
  importFromCSV,
  importLinks,
  detectFormat,
} from '../src/api/export-import.mjs';

// ============================================================================
// Export Tests
// ============================================================================

describe('exportToLinksNotation', () => {
  it('exports links to Links Notation format', () => {
    const links = [
      { id: 1, source: 100, target: 200 },
      { id: 2, source: 300, target: 400 },
    ];
    const result = exportToLinksNotation(links);
    expect(result).toContain('(1: 100 200)');
    expect(result).toContain('(2: 300 400)');
  });

  it('returns empty tuple for empty array', () => {
    const result = exportToLinksNotation([]);
    expect(result).toBe('()\n');
  });

  it('handles non-array input', () => {
    const result = exportToLinksNotation(null);
    expect(result).toBe('()\n');
  });
});

describe('exportToJSON', () => {
  it('exports links to JSON format', () => {
    const links = [{ id: 1, source: 100, target: 200 }];
    const result = exportToJSON(links);
    const parsed = JSON.parse(result);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].source).toBe(100);
    expect(parsed[0].target).toBe(200);
  });

  it('exports pretty-printed JSON by default', () => {
    const links = [{ id: 1, source: 100, target: 200 }];
    const result = exportToJSON(links);
    expect(result).toContain('\n');
  });

  it('exports compact JSON when pretty=false', () => {
    const links = [{ id: 1, source: 100, target: 200 }];
    const result = exportToJSON(links, false);
    expect(result).not.toContain('\n');
  });
});

describe('exportToCSV', () => {
  it('exports links to CSV format with header', () => {
    const links = [
      { id: 1, source: 100, target: 200 },
      { id: 2, source: 300, target: 400 },
    ];
    const result = exportToCSV(links);
    const lines = result.trim().split('\n');
    expect(lines[0]).toBe('id,source,target');
    expect(lines[1]).toBe('1,100,200');
    expect(lines[2]).toBe('2,300,400');
  });

  it('exports CSV without header when includeHeader=false', () => {
    const links = [{ id: 1, source: 100, target: 200 }];
    const result = exportToCSV(links, ',', false);
    expect(result.trim()).toBe('1,100,200');
  });

  it('uses custom delimiter', () => {
    const links = [{ id: 1, source: 100, target: 200 }];
    const result = exportToCSV(links, ';');
    expect(result).toContain('id;source;target');
    expect(result).toContain('1;100;200');
  });

  it('returns header only for empty array', () => {
    const result = exportToCSV([]);
    expect(result).toBe('id,source,target\n');
  });
});

describe('exportLinks', () => {
  const testLinks = [{ id: 1, source: 100, target: 200 }];

  it('exports to Links Notation by default', () => {
    const result = exportLinks(testLinks);
    expect(result).toContain('(1: 100 200)');
  });

  it('exports to JSON format', () => {
    const result = exportLinks(testLinks, 'json');
    expect(JSON.parse(result)[0].id).toBe(1);
  });

  it('exports to CSV format', () => {
    const result = exportLinks(testLinks, 'csv');
    expect(result).toContain('id,source,target');
  });

  it('throws for unsupported format', () => {
    expect(() => exportLinks(testLinks, 'xml')).toThrow(
      'Unsupported export format'
    );
  });
});

// ============================================================================
// Import Tests
// ============================================================================

describe('importFromLinksNotation', () => {
  it('imports links from Links Notation', () => {
    const content = '(1: 100 200)\n(2: 300 400)';
    const result = importFromLinksNotation(content);
    expect(result.length).toBe(2);
    expect(result[0].source).toBe(100);
    expect(result[0].target).toBe(200);
    expect(result[0].originalId).toBe(1);
  });

  it('returns empty array for empty content', () => {
    expect(importFromLinksNotation('')).toEqual([]);
    expect(importFromLinksNotation(null)).toEqual([]);
  });
});

describe('importFromJSON', () => {
  it('imports links from JSON array', () => {
    const content = '[{"id": 1, "source": 100, "target": 200}]';
    const result = importFromJSON(content);
    expect(result.length).toBe(1);
    expect(result[0].source).toBe(100);
    expect(result[0].target).toBe(200);
    expect(result[0].originalId).toBe(1);
  });

  it('imports single object as array', () => {
    const content = '{"source": 100, "target": 200}';
    const result = importFromJSON(content);
    expect(result.length).toBe(1);
    expect(result[0].source).toBe(100);
  });

  it('throws for invalid JSON', () => {
    expect(() => importFromJSON('not json')).toThrow('Invalid JSON');
  });

  it('returns empty array for empty content', () => {
    expect(importFromJSON('')).toEqual([]);
    expect(importFromJSON(null)).toEqual([]);
  });
});

describe('importFromCSV', () => {
  it('imports links from CSV with header', () => {
    const content = 'id,source,target\n1,100,200\n2,300,400';
    const result = importFromCSV(content);
    expect(result.length).toBe(2);
    expect(result[0].source).toBe(100);
    expect(result[0].target).toBe(200);
    expect(result[0].originalId).toBe(1);
  });

  it('imports CSV without header', () => {
    const content = '1,100,200\n2,300,400';
    const result = importFromCSV(content, ',', false);
    expect(result.length).toBe(2);
    // Without header, uses positional indices
    expect(result[0].source).toBe(100);
    expect(result[0].target).toBe(200);
  });

  it('handles semicolon delimiter', () => {
    const content = 'id;source;target\n1;100;200';
    const result = importFromCSV(content, ';');
    expect(result[0].source).toBe(100);
  });

  it('returns empty array for empty content', () => {
    expect(importFromCSV('')).toEqual([]);
    expect(importFromCSV(null)).toEqual([]);
  });
});

describe('importLinks', () => {
  it('imports from Links Notation by default', () => {
    const content = '(1: 100 200)';
    const result = importLinks(content);
    expect(result[0].source).toBe(100);
  });

  it('imports from JSON format', () => {
    const content = '[{"source": 100, "target": 200}]';
    const result = importLinks(content, 'json');
    expect(result[0].source).toBe(100);
  });

  it('imports from CSV format', () => {
    const content = 'id,source,target\n1,100,200';
    const result = importLinks(content, 'csv');
    expect(result[0].source).toBe(100);
  });

  it('throws for unsupported format', () => {
    expect(() => importLinks('data', 'xml')).toThrow(
      'Unsupported import format'
    );
  });
});

// ============================================================================
// Format Detection Tests
// ============================================================================

describe('detectFormat', () => {
  it('detects JSON array', () => {
    expect(detectFormat('[{"id": 1}]')).toBe(ExportFormats.JSON);
  });

  it('detects JSON object', () => {
    expect(detectFormat('{"id": 1}')).toBe(ExportFormats.JSON);
  });

  it('detects CSV', () => {
    expect(detectFormat('id,source,target\n1,100,200')).toBe(ExportFormats.CSV);
  });

  it('detects Links Notation', () => {
    expect(detectFormat('(1: 100 200)')).toBe(ExportFormats.LINKS_NOTATION);
  });

  it('defaults to Links Notation for empty content', () => {
    expect(detectFormat('')).toBe(ExportFormats.LINKS_NOTATION);
    expect(detectFormat(null)).toBe(ExportFormats.LINKS_NOTATION);
  });

  it('defaults to Links Notation for ambiguous content', () => {
    expect(detectFormat('some text')).toBe(ExportFormats.LINKS_NOTATION);
  });
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe('round-trip export/import', () => {
  const originalLinks = [
    { id: 1, source: 100, target: 200 },
    { id: 2, source: 300, target: 400 },
  ];

  it('round-trips through JSON', () => {
    const exported = exportLinks(originalLinks, 'json');
    const imported = importLinks(exported, 'json');
    expect(imported.length).toBe(2);
    expect(imported[0].source).toBe(100);
    expect(imported[0].target).toBe(200);
    expect(imported[1].source).toBe(300);
    expect(imported[1].target).toBe(400);
  });

  it('round-trips through CSV', () => {
    const exported = exportLinks(originalLinks, 'csv');
    const imported = importLinks(exported, 'csv');
    expect(imported.length).toBe(2);
    expect(imported[0].source).toBe(100);
    expect(imported[0].target).toBe(200);
  });

  it('round-trips through Links Notation', () => {
    const exported = exportLinks(originalLinks, 'ln');
    const imported = importLinks(exported, 'ln');
    expect(imported.length).toBe(2);
    expect(imported[0].source).toBe(100);
    expect(imported[0].target).toBe(200);
  });
});

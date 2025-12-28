/**
 * Export/Import Module
 *
 * Provides data export and import capabilities for links.
 * Supports multiple formats:
 * - Links Notation (.ln) - Native format
 * - JSON (.json) - Standard JSON format
 * - CSV (.csv) - Comma-separated values
 *
 * Inspired by ideav/local export_import.py implementation.
 */

import { Parser } from 'links-notation';

/**
 * Export formats
 */
export const ExportFormats = {
  LINKS_NOTATION: 'ln',
  JSON: 'json',
  CSV: 'csv',
};

/**
 * Export links to Links Notation format
 * @param {Array} links - Array of link objects {id, source, target}
 * @returns {string} Links Notation formatted string
 */
export function exportToLinksNotation(links) {
  if (!Array.isArray(links) || links.length === 0) {
    return '()\n';
  }

  return `${links.map((link) => `(${link.id}: ${link.source} ${link.target})`).join('\n')}\n`;
}

/**
 * Export links to JSON format
 * @param {Array} links - Array of link objects
 * @param {boolean} pretty - Whether to pretty-print the JSON
 * @returns {string} JSON formatted string
 */
export function exportToJSON(links, pretty = true) {
  if (!Array.isArray(links)) {
    links = [];
  }

  if (pretty) {
    return JSON.stringify(links, null, 2);
  }
  return JSON.stringify(links);
}

/**
 * Export links to CSV format
 * @param {Array} links - Array of link objects
 * @param {string} delimiter - Field delimiter (default: comma)
 * @param {boolean} includeHeader - Whether to include header row
 * @returns {string} CSV formatted string
 */
export function exportToCSV(links, delimiter = ',', includeHeader = true) {
  if (!Array.isArray(links) || links.length === 0) {
    return includeHeader ? `id${delimiter}source${delimiter}target\n` : '';
  }

  const lines = [];

  if (includeHeader) {
    lines.push(`id${delimiter}source${delimiter}target`);
  }

  for (const link of links) {
    lines.push(
      `${link.id}${delimiter}${link.source}${delimiter}${link.target}`
    );
  }

  return `${lines.join('\n')}\n`;
}

/**
 * Export links to the specified format
 * @param {Array} links - Array of link objects
 * @param {string} format - Export format (ln, json, csv)
 * @param {Object} options - Format-specific options
 * @returns {string} Formatted string
 */
export function exportLinks(
  links,
  format = ExportFormats.LINKS_NOTATION,
  options = {}
) {
  switch (format.toLowerCase()) {
    case ExportFormats.LINKS_NOTATION:
    case 'links-notation':
    case 'links':
      return exportToLinksNotation(links);

    case ExportFormats.JSON:
      return exportToJSON(links, options.pretty !== false);

    case ExportFormats.CSV:
      return exportToCSV(
        links,
        options.delimiter || ',',
        options.includeHeader !== false
      );

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Import links from Links Notation format
 * @param {string} content - Links Notation formatted string
 * @returns {Array} Array of link objects {source, target} (id is assigned on creation)
 */
export function importFromLinksNotation(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const parser = new Parser();
  const parsed = parser.parse(content);

  return parsed.map((item) => {
    // links-notation format: id is the label, values are source and target
    const link = {
      source: 0,
      target: 0,
    };

    // If there's an id (label), it might be the link ID from export
    if (item.id !== null) {
      link.originalId = parseInt(item.id, 10);
    }

    // Values array contains source and target
    if (item.values && item.values.length >= 2) {
      link.source = parseInt(item.values[0].id, 10) || 0;
      link.target = parseInt(item.values[1].id, 10) || 0;
    } else if (item.values && item.values.length === 1) {
      // Single value - could be just source
      link.source = parseInt(item.values[0].id, 10) || 0;
    }

    return link;
  });
}

/**
 * Import links from JSON format
 * @param {string} content - JSON formatted string
 * @returns {Array} Array of link objects
 */
export function importFromJSON(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  try {
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      // Single object
      return [data];
    }

    return data.map((item) => ({
      source: parseInt(item.source, 10) || 0,
      target: parseInt(item.target, 10) || 0,
      originalId: item.id !== undefined ? parseInt(item.id, 10) : undefined,
    }));
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
}

/**
 * Import links from CSV format
 * @param {string} content - CSV formatted string
 * @param {string} delimiter - Field delimiter
 * @param {boolean} hasHeader - Whether first row is header
 * @returns {Array} Array of link objects
 */
export function importFromCSV(content, delimiter = ',', hasHeader = true) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) {
    return [];
  }

  let startIndex = 0;
  let idIndex = 0;
  let sourceIndex = 1;
  let targetIndex = 2;

  if (hasHeader) {
    const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    idIndex = header.indexOf('id');
    sourceIndex = header.indexOf('source');
    targetIndex = header.indexOf('target');

    // Fallback to positional if headers not found
    if (sourceIndex === -1) {
      sourceIndex = 1;
    }
    if (targetIndex === -1) {
      targetIndex = 2;
    }

    startIndex = 1;
  }

  const links = [];
  for (let i = startIndex; i < lines.length; i++) {
    const fields = lines[i].split(delimiter).map((f) => f.trim());

    const link = {
      source: parseInt(fields[sourceIndex], 10) || 0,
      target: parseInt(fields[targetIndex], 10) || 0,
    };

    if (idIndex >= 0 && fields[idIndex]) {
      link.originalId = parseInt(fields[idIndex], 10);
    }

    links.push(link);
  }

  return links;
}

/**
 * Import links from the specified format
 * @param {string} content - Formatted string
 * @param {string} format - Import format (ln, json, csv)
 * @param {Object} options - Format-specific options
 * @returns {Array} Array of link objects
 */
export function importLinks(
  content,
  format = ExportFormats.LINKS_NOTATION,
  options = {}
) {
  switch (format.toLowerCase()) {
    case ExportFormats.LINKS_NOTATION:
    case 'links-notation':
    case 'links':
      return importFromLinksNotation(content);

    case ExportFormats.JSON:
      return importFromJSON(content);

    case ExportFormats.CSV:
      return importFromCSV(
        content,
        options.delimiter || ',',
        options.hasHeader !== false
      );

    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

/**
 * Detect the format of a content string
 * @param {string} content - The content to analyze
 * @returns {string} Detected format
 */
export function detectFormat(content) {
  if (!content || typeof content !== 'string') {
    return ExportFormats.LINKS_NOTATION;
  }

  const trimmed = content.trim();

  // JSON detection
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return ExportFormats.JSON;
    } catch {
      // Not valid JSON
    }
  }

  // CSV detection (has commas and no parentheses at start of lines)
  const lines = trimmed.split('\n');
  if (lines.length > 0 && lines[0].includes(',') && !lines[0].startsWith('(')) {
    return ExportFormats.CSV;
  }

  // Default to Links Notation
  return ExportFormats.LINKS_NOTATION;
}

export default {
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
};

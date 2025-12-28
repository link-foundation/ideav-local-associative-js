// Main entry point for ideav-local-associative-js
// Re-exports the server configuration and utilities

export { app, linkdb, ilinks, recursiveLinks } from './server.mjs';
export { default } from './server.mjs';

// Re-export API modules for programmatic use
export { createRecursiveLinksRouter } from './api/recursive-links-routes.mjs';
export { createObjectsRouter } from './api/objects-routes.mjs';
export {
  FilterOperators,
  parseFilterValue,
  applyFilter,
  applyFilters,
  filterLinks,
  describeFilters,
} from './api/filters.mjs';
export {
  ExportFormats,
  exportLinks,
  importLinks,
  exportToLinksNotation,
  exportToJSON,
  exportToCSV,
  importFromLinksNotation,
  importFromJSON,
  importFromCSV,
  detectFormat,
} from './api/export-import.mjs';

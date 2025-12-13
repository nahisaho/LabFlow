/**
 * Formatting Utilities for CLI
 *
 * Provides table and JSON formatting for CLI output
 */

export interface TableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

export interface FormatOptions {
  maxContentLength?: number;
}

/**
 * Format data as ASCII table
 * If columns not provided, auto-detect from first row
 */
export function formatAsTable<T extends Record<string, unknown>>(
  data: T[],
  columnsOrOptions?: TableColumn[] | FormatOptions
): string {
  if (data.length === 0) {
    return 'No data to display';
  }

  // Determine columns and options
  let columns: TableColumn[];
  let options: FormatOptions = {};

  if (Array.isArray(columnsOrOptions)) {
    columns = columnsOrOptions;
  } else {
    options = columnsOrOptions ?? {};
    // Auto-detect columns from first row
    columns = Object.keys(data[0]).map((key) => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      width: Math.max(
        key.length,
        ...data.map((row) => {
          const val = String(row[key] ?? '');
          const maxLen = options.maxContentLength ?? 50;
          return val.length > maxLen ? maxLen : val.length;
        })
      ),
    }));
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerWidth = col.header.length;
    const maxDataWidth = Math.max(
      ...data.map((row) => {
        const val = String(row[col.key] ?? '');
        const maxLen = options.maxContentLength ?? val.length;
        return Math.min(val.length, maxLen);
      })
    );
    return col.width ?? Math.max(headerWidth, maxDataWidth);
  });

  // Build header
  const header = columns
    .map((col, i) => padString(col.header, widths[i], col.align ?? 'left'))
    .join(' │ ');

  // Build separator
  const separator = widths.map((w) => '─'.repeat(w)).join('─┼─');

  // Build rows
  const rows = data.map((row) =>
    columns
      .map((col, i) => {
        let val = String(row[col.key] ?? '');
        // Truncate if maxContentLength specified
        if (options.maxContentLength && val.length > options.maxContentLength) {
          val = val.slice(0, options.maxContentLength - 3) + '...';
        }
        return padString(val, widths[i], col.align ?? 'left');
      })
      .join(' │ ')
  );

  return [header, separator, ...rows].join('\n');
}

/**
 * Format data as JSON (pretty printed)
 */
export function formatAsJson(data: unknown, indent: number = 2): string {
  return JSON.stringify(data, null, indent);
}

/**
 * Format a validation result for display
 */
export function formatValidationResult(result: {
  isValid: boolean;
  errors: { path: string; message: string }[];
  warnings: { path: string; message: string }[];
}): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push('✓ Validation passed');
  } else {
    lines.push('✗ Validation failed');
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const error of result.errors) {
      const path = error.path ? `[${error.path}] ` : '';
      lines.push(`  ✗ ${path}${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      const path = warning.path ? `[${warning.path}] ` : '';
      lines.push(`  ⚠ ${path}${warning.message}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format search results for display
 */
export function formatSearchResults(
  results: {
    documentId: string;
    score: number;
    metadata?: Record<string, unknown>;
  }[]
): string {
  if (results.length === 0) {
    return 'No results found';
  }

  const columns: TableColumn[] = [
    { key: 'documentId', header: 'Document', width: 40 },
    { key: 'score', header: 'Score', width: 8, align: 'right' },
    { key: 'type', header: 'Type', width: 15 },
  ];

  const data = results.map((r) => ({
    documentId: truncateString(r.documentId, 38),
    score: r.score.toFixed(4),
    type: (r.metadata?.type as string) ?? 'unknown',
  }));

  return formatAsTable(data, columns);
}

/**
 * Format workflow list for display
 */
export function formatWorkflowList(
  workflows: {
    name: string;
    path: string;
    status: string;
    stepCount: number;
  }[]
): string {
  if (workflows.length === 0) {
    return 'No workflows found';
  }

  const columns: TableColumn[] = [
    { key: 'name', header: 'Name', width: 25 },
    { key: 'status', header: 'Status', width: 10 },
    { key: 'stepCount', header: 'Steps', width: 6, align: 'right' },
    { key: 'path', header: 'Path', width: 40 },
  ];

  const data = workflows.map((w) => ({
    name: truncateString(w.name, 23),
    status: w.status,
    stepCount: String(w.stepCount),
    path: truncateString(w.path, 38),
  }));

  return formatAsTable(data, columns);
}

/**
 * Pad string to specified width with alignment
 */
function padString(
  str: string,
  width: number,
  align: 'left' | 'right' | 'center'
): string {
  const truncated = str.length > width ? str.slice(0, width - 1) + '…' : str;
  const padding = width - truncated.length;

  switch (align) {
    case 'right':
      return ' '.repeat(padding) + truncated;
    case 'center':
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return ' '.repeat(left) + truncated + ' '.repeat(right);
    case 'left':
    default:
      return truncated + ' '.repeat(padding);
  }
}

/**
 * Truncate string with ellipsis
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

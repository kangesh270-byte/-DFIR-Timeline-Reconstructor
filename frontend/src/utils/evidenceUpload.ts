import Papa from 'papaparse';

export interface ParsedEvidenceRecord {
  timestamp?: string;
  title?: string;
  description?: string;
  severity?: string;
  source?: string;
  user?: string;
  host?: string;
  processName?: string;
  fileName?: string;
  fileHash?: string;
  registryKey?: string;
  ipAddress?: string;
  domain?: string;
  url?: string;
  macAddress?: string;
  category?: string;
  [key: string]: unknown;
}

export interface ParsedEvidenceUpload {
  records: ParsedEvidenceRecord[];
  warnings: string[];
  errors: string[];
}

const DEFAULT_TITLE = 'Unknown Event';
const DEFAULT_SEVERITY = 'Medium';
const DEFAULT_SOURCE = 'Unknown';
const DEFAULT_DESCRIPTION = 'No description provided';

function normalizeFieldName(field: string): string {
  const trimmed = field.replace(/^\uFEFF/, '').trim();
  const lowered = trimmed.toLowerCase().replace(/[\s-]+/g, '_');

  const aliases: Record<string, string> = {
    timestamp: 'timestamp',
    time: 'timestamp',
    date: 'timestamp',
    datetime: 'timestamp',
    event_time: 'timestamp',
    log_time: 'timestamp',
    eventtime: 'timestamp',
    title: 'title',
    event: 'title',
    event_type: 'title',
    eventtype: 'title',
    activity: 'title',
    event_name: 'title',
    eventname: 'title',
    name: 'title',
    description: 'description',
    details: 'description',
    summary: 'description',
    message: 'description',
    log: 'description',
    note: 'description',
    severity: 'severity',
    level: 'severity',
    priority: 'severity',
    risk: 'severity',
    source: 'source',
    source_name: 'source',
    log_source: 'source',
    system: 'source',
    provider: 'source',
    device: 'source',
    user: 'user',
    username: 'user',
    user_name: 'user',
    host: 'host',
    hostname: 'host',
    computer: 'host',
    process_name: 'processName',
    processname: 'processName',
    process: 'processName',
    file_name: 'fileName',
    filename: 'fileName',
    file_hash: 'fileHash',
    filehash: 'fileHash',
    hash: 'fileHash',
    sha256: 'fileHash',
    md5: 'fileHash',
    registry_key: 'registryKey',
    registrykey: 'registryKey',
    registry: 'registryKey',
    ip_address: 'ipAddress',
    ipaddress: 'ipAddress',
    src_ip: 'ipAddress',
    dest_ip: 'ipAddress',
    ip: 'ipAddress',
    domain: 'domain',
    url: 'url',
    mac_address: 'macAddress',
    macaddress: 'macAddress',
    category: 'category',
  };

  return aliases[lowered] ?? lowered;
}

function normalizeValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return String(value);
}

function normalizeRecord(rawRow: Record<string, unknown>): ParsedEvidenceRecord {
  const normalizedRow: ParsedEvidenceRecord = {};

  Object.entries(rawRow).forEach(([key, value]) => {
    const normalizedKey = normalizeFieldName(key);
    const normalizedValue = normalizeValue(value);

    if (normalizedKey && normalizedValue !== undefined) {
      normalizedRow[normalizedKey] = normalizedValue;
    }
  });

  return normalizedRow;
}

function applyDefaults(row: ParsedEvidenceRecord, warnings: string[], rowNumber: number): void {
  if (!row.timestamp || !String(row.timestamp).trim()) {
    throw new Error(`Row ${rowNumber}: Missing required field timestamp.`);
  }

  if (!row.title || !String(row.title).trim()) {
    row.title = DEFAULT_TITLE;
    warnings.push(`Row ${rowNumber}: Missing title; using "${DEFAULT_TITLE}".`);
  } else {
    row.title = String(row.title).trim();
  }

  if (!row.description || !String(row.description).trim()) {
    row.description = DEFAULT_DESCRIPTION;
    warnings.push(`Row ${rowNumber}: Missing description; using "${DEFAULT_DESCRIPTION}".`);
  } else {
    row.description = String(row.description).trim();
  }

  if (!row.severity || !String(row.severity).trim()) {
    row.severity = DEFAULT_SEVERITY;
    warnings.push(`Row ${rowNumber}: Missing severity; using "${DEFAULT_SEVERITY}".`);
  } else {
    row.severity = String(row.severity).trim();
  }

  if (!row.source || !String(row.source).trim()) {
    row.source = DEFAULT_SOURCE;
    warnings.push(`Row ${rowNumber}: Missing source; using "${DEFAULT_SOURCE}".`);
  } else {
    row.source = String(row.source).trim();
  }

  row.timestamp = String(row.timestamp).trim();
}

export async function parseEvidenceUpload(file: File): Promise<ParsedEvidenceUpload> {
  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    try {
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? [parsed] : [];
      const warnings: string[] = [];
      const records: ParsedEvidenceRecord[] = [];

      rows.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          warnings.push(`JSON row ${index + 1}: Ignored invalid entry.`);
          return;
        }

        const normalizedRow = normalizeRecord(item as Record<string, unknown>);
        try {
          applyDefaults(normalizedRow, warnings, index + 1);
          records.push(normalizedRow);
        } catch (error) {
          warnings.push((error as Error).message);
        }
      });

      return {
        records,
        warnings,
        errors: [],
      };
    } catch (error) {
      return {
        records: [],
        warnings: [],
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  if (extension !== 'csv') {
    return {
      records: [],
      warnings: [],
      errors: ['Unsupported file type. Only CSV and JSON are supported.'],
    };
  }

  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeFieldName(header),
      complete: (results) => {
        const rowData = results.data ?? [];
        const validRecords: ParsedEvidenceRecord[] = [];
        const warnings: string[] = [];
        const errors: string[] = [];

        rowData.forEach((rawRow, index) => {
          const row = rawRow ?? {};
          if (!Object.keys(row).length) {
            return;
          }

          const normalizedRow = normalizeRecord(row as Record<string, unknown>);

          try {
            applyDefaults(normalizedRow, warnings, index + 2);
            validRecords.push(normalizedRow);
          } catch (error) {
            warnings.push((error as Error).message);
          }
        });

        if (results.errors.length > 0) {
          results.errors.forEach((issue) => {
            if (issue.type !== 'FieldMismatch') {
              errors.push(`CSV parse warning: ${issue.message}`);
            }
          });
        }

        resolve({ records: validRecords, warnings, errors });
      },
      error: (error) => {
        resolve({ records: [], warnings: [], errors: [`CSV parsing failed: ${error.message}`] });
      },
    });
  });
}

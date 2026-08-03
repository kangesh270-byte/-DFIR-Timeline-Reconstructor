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
  errors: string[];
}

const REQUIRED_FIELDS = ['timestamp', 'title', 'description', 'severity', 'source'];
const OPTIONAL_FIELDS = ['user', 'host', 'processName', 'fileName', 'fileHash', 'registryKey', 'ipAddress', 'domain', 'url', 'macAddress'];

function normalizeFieldName(field: string): string {
  const trimmed = field.replace(/^\uFEFF/, '').trim();
  const lowered = trimmed.toLowerCase();

  const aliases: Record<string, string> = {
    timestamp: 'timestamp',
    title: 'title',
    description: 'description',
    severity: 'severity',
    source: 'source',
    process_name: 'processName',
    processname: 'processName',
    file_name: 'fileName',
    filename: 'fileName',
    file_hash: 'fileHash',
    filehash: 'fileHash',
    registry_key: 'registryKey',
    registrykey: 'registryKey',
    user_name: 'user',
    username: 'user',
    user: 'user',
    host: 'host',
    ip_address: 'ipAddress',
    ipaddress: 'ipAddress',
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

function normalizeRecord(record: Record<string, unknown>, headers: string[]): ParsedEvidenceRecord {
  const normalizedRecord: ParsedEvidenceRecord = {};

  headers.forEach((header) => {
    const normalizedKey = normalizeFieldName(header);
    const normalizedValue = normalizeValue(record[header]);
    if (normalizedValue !== undefined) {
      normalizedRecord[normalizedKey] = normalizedValue;
    }
  });

  return normalizedRecord;
}

function getMissingRequiredFields(record: ParsedEvidenceRecord): string[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = record[field];
    return value === undefined || String(value).trim() === '';
  });
}

export async function parseEvidenceUpload(file: File): Promise<ParsedEvidenceUpload> {
  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return {
          records: parsed.map((item) => item as ParsedEvidenceRecord),
          errors: [],
        };
      }

      if (parsed && typeof parsed === 'object') {
        return {
          records: [parsed as ParsedEvidenceRecord],
          errors: [],
        };
      }

      return {
        records: [],
        errors: ['JSON content must be an object or an array of objects.'],
      };
    } catch (error) {
      return {
        records: [],
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  if (extension !== 'csv') {
    return {
      records: [],
      errors: ['Unsupported file type. Only CSV and JSON are supported.'],
    };
  }

  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeFieldName(header),
      complete: (results) => {
        const rawData = results.data ?? [];
        const firstParsedRow = rawData[0] ?? {};
        const rawHeaders = Object.keys(firstParsedRow);

        console.log('Raw CSV headers:', rawHeaders);
        console.log('Normalized headers:', rawHeaders.map((header) => normalizeFieldName(header)));
        console.log('First parsed row:', firstParsedRow);
        console.log('Object.keys(firstParsedRow):', Object.keys(firstParsedRow));

        const normalizedRecords: ParsedEvidenceRecord[] = [];
        const errors: string[] = [];

        rawData.forEach((row, index) => {
          const normalizedRow = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [normalizeFieldName(key), normalizeValue(value)])
          );

          const normalizedRecord = normalizeRecord(normalizedRow as Record<string, unknown>, Object.keys(normalizedRow));
          const missingFields = getMissingRequiredFields(normalizedRecord);

          console.log('parsedRows:', rawData);
          console.log('parsedRows[0]:', rawData[0]);
          console.log('Object.keys(parsedRows[0]):', Object.keys(rawData[0] ?? {}));

          if (missingFields.length > 0) {
            console.log('Validation failed for row:', row);
            console.log('Parsed object:', normalizedRecord);
            console.log('Missing required fields:', missingFields);
            errors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
            return;
          }

          normalizedRecords.push(normalizedRecord);
        });

        if (errors.length > 0) {
          resolve({ records: [], errors });
          return;
        }

        console.log('Validated records:', normalizedRecords);
        resolve({ records: normalizedRecords, errors: [] });
      },
      error: (error) => {
        resolve({ records: [], errors: [`CSV parsing failed: ${error.message}`] });
      },
    });
  });
}

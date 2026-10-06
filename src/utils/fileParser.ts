import { gunzipSync, strFromU8 } from 'fflate';
import { BarData, FlowAndGex } from '../types.ts';

export interface ParsedCatalogFile {
  fileName: string;
  fileType: 'bars' | 'short_interest' | 'events_eligible' | 'askside' | 'netprem' | 'unknown';
  summary: string;
  recordCount: number;
  data: any;
}

export async function parseUploadedFile(file: File): Promise<ParsedCatalogFile> {
  let text = '';

  if (file.name.endsWith('.gz')) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decompressed = gunzipSync(uint8Array);
    text = strFromU8(decompressed);
  } else {
    text = await file.text();
  }

  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON in ${file.name}: ${(err as Error).message}`);
  }

  return categorizeCatalogJson(file.name, json);
}

export function categorizeCatalogJson(fileName: string, json: any): ParsedCatalogFile {
  // 1. Massive Bars format: { results: [{ t, o, h, l, c, v }] } or array of bars
  if (json.results && Array.isArray(json.results) && json.results.length > 0 && 'c' in json.results[0]) {
    return {
      fileName,
      fileType: 'bars',
      summary: `Massive API 5m Bars (${json.results.length} intervals)`,
      recordCount: json.results.length,
      data: json.results,
    };
  }

  // 2. Events eligible: { events: [...] }
  if (json.events && Array.isArray(json.events)) {
    return {
      fileName,
      fileType: 'events_eligible',
      summary: `Breakout Events Eligible (${json.events.length} rows)`,
      recordCount: json.events.length,
      data: json.events,
    };
  }

  // 3. Coil smoke: { movers: [...] }
  if (json.movers && Array.isArray(json.movers)) {
    return {
      fileName,
      fileType: 'events_eligible',
      summary: `Daily Coil Movers (${json.movers.length} rows)`,
      recordCount: json.movers.length,
      data: json.movers,
    };
  }

  // 4. Short interest series: object with tickers as keys, or array
  if (typeof json === 'object' && !Array.isArray(json)) {
    const keys = Object.keys(json);
    if (keys.length > 0 && Array.isArray(json[keys[0]]) && 'short_interest' in (json[keys[0]][0] || {})) {
      const totalRows = keys.reduce((acc, k) => acc + json[k].length, 0);
      return {
        fileName,
        fileType: 'short_interest',
        summary: `Short Interest Series (${keys.length} tickers, ${totalRows} historical bi-weekly rows)`,
        recordCount: totalRows,
        data: json,
      };
    }
  }

  // 5. Ask-side flow enrichment or keyed lookups
  if (typeof json === 'object' && !Array.isArray(json)) {
    const sampleKey = Object.keys(json)[0];
    if (sampleKey && json[sampleKey] && 'call_volume_ask_side' in json[sampleKey]) {
      return {
        fileName,
        fileType: 'askside',
        summary: `Ask-Side Flow Enrichment (${Object.keys(json).length} ticker-dates)`,
        recordCount: Object.keys(json).length,
        data: json,
      };
    }
    if (sampleKey && json[sampleKey] && 'net_call_prem' in json[sampleKey]) {
      return {
        fileName,
        fileType: 'netprem',
        summary: `Net Premium / Delta Features (${Object.keys(json).length} ticker-dates)`,
        recordCount: Object.keys(json).length,
        data: json,
      };
    }
  }

  // Array of records
  if (Array.isArray(json)) {
    return {
      fileName,
      fileType: 'unknown',
      summary: `JSON Array (${json.length} items)`,
      recordCount: json.length,
      data: json,
    };
  }

  return {
    fileName,
    fileType: 'unknown',
    summary: `Structured JSON object (${Object.keys(json).length} top-level keys)`,
    recordCount: Object.keys(json).length,
    data: json,
  };
}

/**
 * Converts Massive results format [{t, o, h, l, c, v}] into BarData[]
 */
export function convertMassiveToBarData(results: any[]): BarData[] {
  return results.map((r: any) => ({
    timestamp: new Date(r.t).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v,
  }));
}

import type { EnrichedAnmeldungen, EnrichedNotizen, EnrichedProtokolle, EnrichedSitzungen, EnrichedThemenFeedback } from '@/types/enriched';
import type { Anmeldungen, Mitglieder, Notizen, Protokolle, Sitzungen, ThemenFeedback } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SitzungenMaps {
  mitgliederMap: Map<string, Mitglieder>;
}

export function enrichSitzungen(
  sitzungen: Sitzungen[],
  maps: SitzungenMaps
): EnrichedSitzungen[] {
  return sitzungen.map(r => ({
    ...r,
    mitgliederName: resolveDisplay(r.fields.mitglieder, maps.mitgliederMap, 'vorname', 'nachname'),
  }));
}

interface AnmeldungenMaps {
  sitzungenMap: Map<string, Sitzungen>;
}

export function enrichAnmeldungen(
  anmeldungen: Anmeldungen[],
  maps: AnmeldungenMaps
): EnrichedAnmeldungen[] {
  return anmeldungen.map(r => ({
    ...r,
    sitzungName: resolveDisplay(r.fields.sitzung, maps.sitzungenMap, 'titel'),
  }));
}

interface ProtokolleMaps {
  sitzungenMap: Map<string, Sitzungen>;
}

export function enrichProtokolle(
  protokolle: Protokolle[],
  maps: ProtokolleMaps
): EnrichedProtokolle[] {
  return protokolle.map(r => ({
    ...r,
    sitzungName: resolveDisplay(r.fields.sitzung, maps.sitzungenMap, 'titel'),
  }));
}

interface ThemenFeedbackMaps {
  sitzungenMap: Map<string, Sitzungen>;
  mitgliederMap: Map<string, Mitglieder>;
}

export function enrichThemenFeedback(
  themenFeedback: ThemenFeedback[],
  maps: ThemenFeedbackMaps
): EnrichedThemenFeedback[] {
  return themenFeedback.map(r => ({
    ...r,
    sitzungName: resolveDisplay(r.fields.sitzung, maps.sitzungenMap, 'titel'),
    verantwortlicherName: resolveDisplay(r.fields.verantwortlicher, maps.mitgliederMap, 'vorname', 'nachname'),
  }));
}

interface NotizenMaps {
  sitzungenMap: Map<string, Sitzungen>;
  protokolleMap: Map<string, Protokolle>;
  mitgliederMap: Map<string, Mitglieder>;
}

export function enrichNotizen(
  notizen: Notizen[],
  maps: NotizenMaps
): EnrichedNotizen[] {
  return notizen.map(r => ({
    ...r,
    sitzungName: resolveDisplay(r.fields.sitzung, maps.sitzungenMap, 'titel'),
    protokollName: resolveDisplay(r.fields.protokoll, maps.protokolleMap, 'titel'),
    mitgliedName: resolveDisplay(r.fields.mitglied, maps.mitgliederMap, 'vorname', 'nachname'),
  }));
}

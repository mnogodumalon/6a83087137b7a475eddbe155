import type { Anmeldungen, Notizen, Protokolle, Sitzungen, ThemenFeedback } from './app';

export type EnrichedSitzungen = Sitzungen & {
  mitgliederName: string;
};

export type EnrichedAnmeldungen = Anmeldungen & {
  sitzungName: string;
};

export type EnrichedProtokolle = Protokolle & {
  sitzungName: string;
};

export type EnrichedThemenFeedback = ThemenFeedback & {
  sitzungName: string;
  verantwortlicherName: string;
};

export type EnrichedNotizen = Notizen & {
  sitzungName: string;
  protokollName: string;
  mitgliedName: string;
};

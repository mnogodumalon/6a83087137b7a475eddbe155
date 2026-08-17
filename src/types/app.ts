import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Mitglieder {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    funktion?: string;
    abteilung?: string;
    status?: LookupValue;
  };
}

export interface Sitzungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    beschreibung?: string;
    tagesordnung?: string;
    mitglieder?: string[];
    einlade_link?: string;
    einladung_versendet?: boolean;
    sitzungsstatus?: LookupValue;
  };
}

export interface Anmeldungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    sitzung?: string; // applookup -> URL zu 'Sitzungen' Record
    vorname?: string;
    nachname?: string;
    email?: string;
    organisation?: string;
    teilnahme?: LookupValue;
    anmerkungen?: string;
  };
}

export interface Protokolle {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    protokollstatus?: LookupValue;
    titel?: string;
    sitzung?: string; // applookup -> URL zu 'Sitzungen' Record
    erstellungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    protokollfuehrer_vorname?: string;
    protokollfuehrer_nachname?: string;
    inhalt?: string;
    beschluesse?: string;
    anhang?: string;
  };
}

export interface ThemenFeedback {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    thementitel?: string;
    sitzung?: string; // applookup -> URL zu 'Sitzungen' Record
    beschreibung?: string;
    verantwortlicher?: string; // applookup -> URL zu 'Mitglieder' Record
    themenstatus?: LookupValue;
    feedback_text?: string;
    bewertung?: LookupValue;
  };
}

export interface Notizen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    notiz_titel?: string;
    notiz_text?: string;
    ersteller_vorname?: string;
    ersteller_nachname?: string;
    notiz_datum?: string; // Format: YYYY-MM-DD oder ISO String
    notiz_typ?: LookupValue;
    sitzung?: string; // applookup -> URL zu 'Sitzungen' Record
    protokoll?: string; // applookup -> URL zu 'Protokolle' Record
    mitglied?: string; // applookup -> URL zu 'Mitglieder' Record
  };
}

export const APP_IDS = {
  MITGLIEDER: '6a830842d546c8fd548dbdb8',
  SITZUNGEN: '6a8308470e2a00ba472be888',
  ANMELDUNGEN: '6a830848df6bc1d8327d7346',
  PROTOKOLLE: '6a830848410a45fc7acca208',
  THEMEN_FEEDBACK: '6a830849735ddb18565dec96',
  NOTIZEN: '6a83084a4ec6d662da521bce',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitglieder': {
    status: [{ key: "inaktiv", get label() { return lookupLabel('mitglieder', 'status', "inaktiv") ?? "Inaktiv"; } }, { key: "aktiv", get label() { return lookupLabel('mitglieder', 'status', "aktiv") ?? "Aktiv"; } }],
  },
  'sitzungen': {
    sitzungsstatus: [{ key: "geplant", get label() { return lookupLabel('sitzungen', 'sitzungsstatus', "geplant") ?? "Geplant"; } }, { key: "eingeladen", get label() { return lookupLabel('sitzungen', 'sitzungsstatus', "eingeladen") ?? "Eingeladen"; } }, { key: "durchgefuehrt", get label() { return lookupLabel('sitzungen', 'sitzungsstatus', "durchgefuehrt") ?? "Durchgeführt"; } }, { key: "abgesagt", get label() { return lookupLabel('sitzungen', 'sitzungsstatus', "abgesagt") ?? "Abgesagt"; } }],
  },
  'anmeldungen': {
    teilnahme: [{ key: "zugesagt", get label() { return lookupLabel('anmeldungen', 'teilnahme', "zugesagt") ?? "Zugesagt"; } }, { key: "abgesagt", get label() { return lookupLabel('anmeldungen', 'teilnahme', "abgesagt") ?? "Abgesagt"; } }, { key: "vielleicht", get label() { return lookupLabel('anmeldungen', 'teilnahme', "vielleicht") ?? "Vielleicht"; } }],
  },
  'protokolle': {
    protokollstatus: [{ key: "entwurf", get label() { return lookupLabel('protokolle', 'protokollstatus', "entwurf") ?? "Entwurf"; } }, { key: "freigegeben", get label() { return lookupLabel('protokolle', 'protokollstatus', "freigegeben") ?? "Freigegeben"; } }],
  },
  'themen_feedback': {
    themenstatus: [{ key: "offen", get label() { return lookupLabel('themen_feedback', 'themenstatus', "offen") ?? "Offen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('themen_feedback', 'themenstatus', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "abgeschlossen", get label() { return lookupLabel('themen_feedback', 'themenstatus', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "vertagt", get label() { return lookupLabel('themen_feedback', 'themenstatus', "vertagt") ?? "Vertagt"; } }],
    bewertung: [{ key: "positiv", get label() { return lookupLabel('themen_feedback', 'bewertung', "positiv") ?? "Positiv"; } }, { key: "neutral", get label() { return lookupLabel('themen_feedback', 'bewertung', "neutral") ?? "Neutral"; } }, { key: "negativ", get label() { return lookupLabel('themen_feedback', 'bewertung', "negativ") ?? "Negativ"; } }],
  },
  'notizen': {
    notiz_typ: [{ key: "sitzung", get label() { return lookupLabel('notizen', 'notiz_typ', "sitzung") ?? "Sitzung"; } }, { key: "protokoll", get label() { return lookupLabel('notizen', 'notiz_typ', "protokoll") ?? "Protokoll"; } }, { key: "mitglied", get label() { return lookupLabel('notizen', 'notiz_typ', "mitglied") ?? "Mitglied"; } }, { key: "allgemein", get label() { return lookupLabel('notizen', 'notiz_typ', "allgemein") ?? "Allgemein"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitglieder': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'funktion': 'string/text',
    'abteilung': 'string/text',
    'status': 'lookup/radio',
  },
  'sitzungen': {
    'titel': 'string/text',
    'datum': 'date/datetimeminute',
    'ort': 'string/text',
    'beschreibung': 'string/textarea',
    'tagesordnung': 'string/textarea',
    'mitglieder': 'multipleapplookup/select',
    'einlade_link': 'string/url',
    'einladung_versendet': 'bool',
    'sitzungsstatus': 'lookup/select',
  },
  'anmeldungen': {
    'sitzung': 'applookup/select',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'organisation': 'string/text',
    'teilnahme': 'lookup/radio',
    'anmerkungen': 'string/textarea',
  },
  'protokolle': {
    'protokollstatus': 'lookup/radio',
    'titel': 'string/text',
    'sitzung': 'applookup/select',
    'erstellungsdatum': 'date/date',
    'protokollfuehrer_vorname': 'string/text',
    'protokollfuehrer_nachname': 'string/text',
    'inhalt': 'string/textarea',
    'beschluesse': 'string/textarea',
    'anhang': 'file',
  },
  'themen_feedback': {
    'thementitel': 'string/text',
    'sitzung': 'applookup/select',
    'beschreibung': 'string/textarea',
    'verantwortlicher': 'applookup/select',
    'themenstatus': 'lookup/select',
    'feedback_text': 'string/textarea',
    'bewertung': 'lookup/radio',
  },
  'notizen': {
    'notiz_titel': 'string/text',
    'notiz_text': 'string/textarea',
    'ersteller_vorname': 'string/text',
    'ersteller_nachname': 'string/text',
    'notiz_datum': 'date/date',
    'notiz_typ': 'lookup/select',
    'sitzung': 'applookup/select',
    'protokoll': 'applookup/select',
    'mitglied': 'applookup/select',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'mitglieder': [
    { field: 'mitglieder', entity: 'sitzungen' },
    { field: 'verantwortlicher', entity: 'themen_feedback' },
    { field: 'mitglied', entity: 'notizen' },
  ],
  'sitzungen': [
    { field: 'sitzung', entity: 'anmeldungen' },
    { field: 'sitzung', entity: 'protokolle' },
    { field: 'sitzung', entity: 'themen_feedback' },
    { field: 'sitzung', entity: 'notizen' },
  ],
};

// Aliases for the pre-0.0.279 app keys (see 4c).
LOOKUP_OPTIONS['themen_&_feedback'] = LOOKUP_OPTIONS['themen_feedback'];
FIELD_TYPES['themen_&_feedback'] = FIELD_TYPES['themen_feedback'];

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitglieder = StripLookup<Mitglieder['fields']>;
export type CreateSitzungen = StripLookup<Sitzungen['fields']>;
export type CreateAnmeldungen = StripLookup<Anmeldungen['fields']>;
export type CreateProtokolle = StripLookup<Protokolle['fields']>;
export type CreateThemenFeedback = StripLookup<ThemenFeedback['fields']>;
export type CreateNotizen = StripLookup<Notizen['fields']>;
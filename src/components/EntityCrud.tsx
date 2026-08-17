/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'mitglieder'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *   …
 *   crud.mitglieder.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.mitglieder.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.mitglieder.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.sitzungen              // memoized Enriched* arrays — reuse these,
 *                                       // never call enrich*() yourself in the page
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   mitglieder: vorname, nachname, email, telefon, funktion, abteilung, status  ·  ← sitzungen (list + contextual +) · ← themen_feedback (list + contextual +) · ← notizen (list + contextual +)
 *   sitzungen: titel, datum, ort, beschreibung, tagesordnung, mitglieder, einlade_link, einladung_versendet, …  ·  → mitglieder · ← anmeldungen (list + contextual +) · ← protokolle (list + contextual +) · ← themen_feedback (list + contextual +) · ← notizen (list + contextual +)
 *   anmeldungen: sitzung, vorname, nachname, email, organisation, teilnahme, anmerkungen  ·  → sitzungen
 *   protokolle: protokollstatus, titel, sitzung, erstellungsdatum, protokollfuehrer_vorname, protokollfuehrer_nachname, inhalt, beschluesse, …  ·  → sitzungen · ← notizen (list + contextual +)
 *   themen_feedback: thementitel, sitzung, beschreibung, verantwortlicher, themenstatus, feedback_text, bewertung  ·  → sitzungen · → mitglieder
 *   notizen: notiz_titel, notiz_text, ersteller_vorname, ersteller_nachname, notiz_datum, notiz_typ, sitzung, protokoll, …  ·  → sitzungen · → protokolle · → mitglieder
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Mitglieder, Sitzungen, Anmeldungen, Protokolle, ThemenFeedback, Notizen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichSitzungen, enrichAnmeldungen, enrichProtokolle, enrichThemenFeedback, enrichNotizen } from '@/lib/enrich';
import type { EnrichedSitzungen, EnrichedAnmeldungen, EnrichedProtokolle, EnrichedThemenFeedback, EnrichedNotizen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { MitgliederDialog, type MitgliederDialogDefaults } from '@/components/dialogs/MitgliederDialog';
import { MitgliederDetails } from '@/components/details/MitgliederDetails';
import { SitzungenDialog, type SitzungenDialogDefaults } from '@/components/dialogs/SitzungenDialog';
import { SitzungenDetails } from '@/components/details/SitzungenDetails';
import { AnmeldungenDialog, type AnmeldungenDialogDefaults } from '@/components/dialogs/AnmeldungenDialog';
import { AnmeldungenDetails } from '@/components/details/AnmeldungenDetails';
import { ProtokolleDialog, type ProtokolleDialogDefaults } from '@/components/dialogs/ProtokolleDialog';
import { ProtokolleDetails } from '@/components/details/ProtokolleDetails';
import { ThemenFeedbackDialog, type ThemenFeedbackDialogDefaults } from '@/components/dialogs/ThemenFeedbackDialog';
import { ThemenFeedbackDetails } from '@/components/details/ThemenFeedbackDetails';
import { NotizenDialog, type NotizenDialogDefaults } from '@/components/dialogs/NotizenDialog';
import { NotizenDetails } from '@/components/details/NotizenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'mitglieder'; record: Mitglieder }
  | { type: 'sitzungen'; record: EnrichedSitzungen }
  | { type: 'anmeldungen'; record: EnrichedAnmeldungen }
  | { type: 'protokolle'; record: EnrichedProtokolle }
  | { type: 'themen_feedback'; record: EnrichedThemenFeedback }
  | { type: 'notizen'; record: EnrichedNotizen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  mitglieder: EntityCrudApi<Mitglieder, MitgliederDialogDefaults>;
  sitzungen: EntityCrudApi<Sitzungen, SitzungenDialogDefaults>;
  anmeldungen: EntityCrudApi<Anmeldungen, AnmeldungenDialogDefaults>;
  protokolle: EntityCrudApi<Protokolle, ProtokolleDialogDefaults>;
  themenFeedback: EntityCrudApi<ThemenFeedback, ThemenFeedbackDialogDefaults>;
  notizen: EntityCrudApi<Notizen, NotizenDialogDefaults>;
  /** Memoized Enriched* arrays — reuse these, never re-enrich in the page. */
  enriched: { sitzungen: EnrichedSitzungen[]; anmeldungen: EnrichedAnmeldungen[]; protokolle: EnrichedProtokolle[]; themenFeedback: EnrichedThemenFeedback[]; notizen: EnrichedNotizen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [mitgliederDialog, setMitgliederDialog] = useState<{ defaults?: MitgliederDialogDefaults; editing?: Mitglieder } | null>(null);
  const [sitzungenDialog, setSitzungenDialog] = useState<{ defaults?: SitzungenDialogDefaults; editing?: Sitzungen } | null>(null);
  const [anmeldungenDialog, setAnmeldungenDialog] = useState<{ defaults?: AnmeldungenDialogDefaults; editing?: Anmeldungen } | null>(null);
  const [protokolleDialog, setProtokolleDialog] = useState<{ defaults?: ProtokolleDialogDefaults; editing?: Protokolle } | null>(null);
  const [themenFeedbackDialog, setThemenFeedbackDialog] = useState<{ defaults?: ThemenFeedbackDialogDefaults; editing?: ThemenFeedback } | null>(null);
  const [notizenDialog, setNotizenDialog] = useState<{ defaults?: NotizenDialogDefaults; editing?: Notizen } | null>(null);
  const enrichedSitzungen = useMemo(() => enrichSitzungen(data.sitzungen, { mitgliederMap: data.mitgliederMap }), [data.sitzungen, data.mitgliederMap]);
  const enrichedAnmeldungen = useMemo(() => enrichAnmeldungen(data.anmeldungen, { sitzungenMap: data.sitzungenMap }), [data.anmeldungen, data.sitzungenMap]);
  const enrichedProtokolle = useMemo(() => enrichProtokolle(data.protokolle, { sitzungenMap: data.sitzungenMap }), [data.protokolle, data.sitzungenMap]);
  const enrichedThemenFeedback = useMemo(() => enrichThemenFeedback(data.themenFeedback, { sitzungenMap: data.sitzungenMap, mitgliederMap: data.mitgliederMap }), [data.themenFeedback, data.sitzungenMap, data.mitgliederMap]);
  const enrichedNotizen = useMemo(() => enrichNotizen(data.notizen, { sitzungenMap: data.sitzungenMap, protokolleMap: data.protokolleMap, mitgliederMap: data.mitgliederMap }), [data.notizen, data.sitzungenMap, data.protokolleMap, data.mitgliederMap]);

  function detailMitglieder(record: Mitglieder, push = false) {
    const item: OverlayItem = { type: 'mitglieder', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitglieder(fields: Mitglieder['fields']) {
    const editing = mitgliederDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitglieder(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitgliederEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitglieder')} — ${t('crud_updated')}`, async () => {
        data.setMitglieder(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitgliederEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitgliederEntry(fields);
      undoToast(`${appLabel('mitglieder')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailSitzungen(record: Sitzungen, push = false) {
    const rec = enrichedSitzungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'sitzungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSitzungen(fields: Sitzungen['fields']) {
    const editing = sitzungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSitzungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSitzungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('sitzungen')} — ${t('crud_updated')}`, async () => {
        data.setSitzungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSitzungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createSitzungenEntry(fields);
      undoToast(`${appLabel('sitzungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAnmeldungen(record: Anmeldungen, push = false) {
    const rec = enrichedAnmeldungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'anmeldungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAnmeldungen(fields: Anmeldungen['fields']) {
    const editing = anmeldungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAnmeldungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAnmeldungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('anmeldungen')} — ${t('crud_updated')}`, async () => {
        data.setAnmeldungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAnmeldungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAnmeldungenEntry(fields);
      undoToast(`${appLabel('anmeldungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailProtokolle(record: Protokolle, push = false) {
    const rec = enrichedProtokolle.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'protokolle', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitProtokolle(fields: Protokolle['fields']) {
    const editing = protokolleDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setProtokolle(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateProtokolleEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('protokolle')} — ${t('crud_updated')}`, async () => {
        data.setProtokolle(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateProtokolleEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createProtokolleEntry(fields);
      undoToast(`${appLabel('protokolle')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailThemenFeedback(record: ThemenFeedback, push = false) {
    const rec = enrichedThemenFeedback.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'themen_feedback', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitThemenFeedback(fields: ThemenFeedback['fields']) {
    const editing = themenFeedbackDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setThemenFeedback(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateThemenFeedbackEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('themen_feedback')} — ${t('crud_updated')}`, async () => {
        data.setThemenFeedback(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateThemenFeedbackEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createThemenFeedbackEntry(fields);
      undoToast(`${appLabel('themen_feedback')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailNotizen(record: Notizen, push = false) {
    const rec = enrichedNotizen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'notizen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitNotizen(fields: Notizen['fields']) {
    const editing = notizenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setNotizen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateNotizenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('notizen')} — ${t('crud_updated')}`, async () => {
        data.setNotizen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateNotizenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createNotizenEntry(fields);
      undoToast(`${appLabel('notizen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <MitgliederDialog
        open={mitgliederDialog !== null}
        onClose={() => setMitgliederDialog(null)}
        onSubmit={submitMitglieder}
        defaultValues={mitgliederDialog?.defaults}
        recordId={mitgliederDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitglieder']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitglieder']}
      />
      <SitzungenDialog
        open={sitzungenDialog !== null}
        onClose={() => setSitzungenDialog(null)}
        onSubmit={submitSitzungen}
        defaultValues={sitzungenDialog?.defaults}
        recordId={sitzungenDialog?.editing?.record_id}
        mitgliederList={data.mitglieder}
        enablePhotoScan={AI_PHOTO_SCAN['Sitzungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Sitzungen']}
      />
      <AnmeldungenDialog
        open={anmeldungenDialog !== null}
        onClose={() => setAnmeldungenDialog(null)}
        onSubmit={submitAnmeldungen}
        defaultValues={anmeldungenDialog?.defaults}
        recordId={anmeldungenDialog?.editing?.record_id}
        sitzungenList={data.sitzungen}
        enablePhotoScan={AI_PHOTO_SCAN['Anmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anmeldungen']}
      />
      <ProtokolleDialog
        open={protokolleDialog !== null}
        onClose={() => setProtokolleDialog(null)}
        onSubmit={submitProtokolle}
        defaultValues={protokolleDialog?.defaults}
        recordId={protokolleDialog?.editing?.record_id}
        sitzungenList={data.sitzungen}
        enablePhotoScan={AI_PHOTO_SCAN['Protokolle']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Protokolle']}
      />
      <ThemenFeedbackDialog
        open={themenFeedbackDialog !== null}
        onClose={() => setThemenFeedbackDialog(null)}
        onSubmit={submitThemenFeedback}
        defaultValues={themenFeedbackDialog?.defaults}
        recordId={themenFeedbackDialog?.editing?.record_id}
        sitzungenList={data.sitzungen}
        mitgliederList={data.mitglieder}
        enablePhotoScan={AI_PHOTO_SCAN['ThemenFeedback']}
        enablePhotoLocation={AI_PHOTO_LOCATION['ThemenFeedback']}
      />
      <NotizenDialog
        open={notizenDialog !== null}
        onClose={() => setNotizenDialog(null)}
        onSubmit={submitNotizen}
        defaultValues={notizenDialog?.defaults}
        recordId={notizenDialog?.editing?.record_id}
        sitzungenList={data.sitzungen}
        protokolleList={data.protokolle}
        mitgliederList={data.mitglieder}
        enablePhotoScan={AI_PHOTO_SCAN['Notizen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Notizen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'mitglieder') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitglieder')} subtitle={undefined} />
                <MitgliederDetails
                  record={top.record}
                  sitzungenList={data.sitzungen}
                  onOpenSitzungen={(r) => detailSitzungen(r, true)}
                  onAddSitzungen={() => setSitzungenDialog({ defaults: { mitglieder: [createRecordUrl(APP_IDS.MITGLIEDER, top.record.record_id)] } })}
                  themenFeedbackList={data.themenFeedback}
                  onOpenThemenFeedback={(r) => detailThemenFeedback(r, true)}
                  onAddThemenFeedback={() => setThemenFeedbackDialog({ defaults: { verantwortlicher: createRecordUrl(APP_IDS.MITGLIEDER, top.record.record_id) } })}
                  notizenList={data.notizen}
                  onOpenNotizen={(r) => detailNotizen(r, true)}
                  onAddNotizen={() => setNotizenDialog({ defaults: { mitglied: createRecordUrl(APP_IDS.MITGLIEDER, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'sitzungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('sitzungen')} subtitle={top.record.fields.datum ? formatDate(top.record.fields.datum) : undefined} />
                <SitzungenDetails
                  record={top.record}
                  mitgliederList={data.mitglieder}
                  anmeldungenList={data.anmeldungen}
                  onOpenAnmeldungen={(r) => detailAnmeldungen(r, true)}
                  onAddAnmeldungen={() => setAnmeldungenDialog({ defaults: { sitzung: createRecordUrl(APP_IDS.SITZUNGEN, top.record.record_id) } })}
                  protokolleList={data.protokolle}
                  onOpenProtokolle={(r) => detailProtokolle(r, true)}
                  onAddProtokolle={() => setProtokolleDialog({ defaults: { sitzung: createRecordUrl(APP_IDS.SITZUNGEN, top.record.record_id) } })}
                  themenFeedbackList={data.themenFeedback}
                  onOpenThemenFeedback={(r) => detailThemenFeedback(r, true)}
                  onAddThemenFeedback={() => setThemenFeedbackDialog({ defaults: { sitzung: createRecordUrl(APP_IDS.SITZUNGEN, top.record.record_id) } })}
                  notizenList={data.notizen}
                  onOpenNotizen={(r) => detailNotizen(r, true)}
                  onAddNotizen={() => setNotizenDialog({ defaults: { sitzung: createRecordUrl(APP_IDS.SITZUNGEN, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'anmeldungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('anmeldungen')} subtitle={undefined} />
                <AnmeldungenDetails
                  record={top.record}
                  sitzungenList={data.sitzungen}
                  onOpenSitzungen={(r) => detailSitzungen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'protokolle') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('protokolle')} subtitle={top.record.fields.erstellungsdatum ? formatDate(top.record.fields.erstellungsdatum) : undefined} />
                <ProtokolleDetails
                  record={top.record}
                  sitzungenList={data.sitzungen}
                  onOpenSitzungen={(r) => detailSitzungen(r, true)}
                  notizenList={data.notizen}
                  onOpenNotizen={(r) => detailNotizen(r, true)}
                  onAddNotizen={() => setNotizenDialog({ defaults: { protokoll: createRecordUrl(APP_IDS.PROTOKOLLE, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'themen_feedback') {
            return (
              <>
                <RecordHeader title={top.record.fields.thementitel ?? appLabel('themen_feedback')} subtitle={undefined} />
                <ThemenFeedbackDetails
                  record={top.record}
                  sitzungenList={data.sitzungen}
                  onOpenSitzungen={(r) => detailSitzungen(r, true)}
                  mitgliederList={data.mitglieder}
                  onOpenMitglieder={(r) => detailMitglieder(r, true)}
                />
              </>
            );
          }
          if (top.type === 'notizen') {
            return (
              <>
                <RecordHeader title={top.record.fields.notiz_titel ?? appLabel('notizen')} subtitle={top.record.fields.notiz_datum ? formatDate(top.record.fields.notiz_datum) : undefined} />
                <NotizenDetails
                  record={top.record}
                  sitzungenList={data.sitzungen}
                  onOpenSitzungen={(r) => detailSitzungen(r, true)}
                  protokolleList={data.protokolle}
                  onOpenProtokolle={(r) => detailProtokolle(r, true)}
                  mitgliederList={data.mitglieder}
                  onOpenMitglieder={(r) => detailMitglieder(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'mitglieder') setMitgliederDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'sitzungen') setSitzungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'anmeldungen') setAnmeldungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'protokolle') setProtokolleDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'themen_feedback') setThemenFeedbackDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'notizen') setNotizenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    mitglieder: {
      openCreate: (defaults?: MitgliederDialogDefaults) => setMitgliederDialog({ defaults }),
      openEdit: (record: Mitglieder) => setMitgliederDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitglieder) => detailMitglieder(record, false),
    },
    sitzungen: {
      openCreate: (defaults?: SitzungenDialogDefaults) => setSitzungenDialog({ defaults }),
      openEdit: (record: Sitzungen) => setSitzungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Sitzungen) => detailSitzungen(record, false),
    },
    anmeldungen: {
      openCreate: (defaults?: AnmeldungenDialogDefaults) => setAnmeldungenDialog({ defaults }),
      openEdit: (record: Anmeldungen) => setAnmeldungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Anmeldungen) => detailAnmeldungen(record, false),
    },
    protokolle: {
      openCreate: (defaults?: ProtokolleDialogDefaults) => setProtokolleDialog({ defaults }),
      openEdit: (record: Protokolle) => setProtokolleDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Protokolle) => detailProtokolle(record, false),
    },
    themenFeedback: {
      openCreate: (defaults?: ThemenFeedbackDialogDefaults) => setThemenFeedbackDialog({ defaults }),
      openEdit: (record: ThemenFeedback) => setThemenFeedbackDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: ThemenFeedback) => detailThemenFeedback(record, false),
    },
    notizen: {
      openCreate: (defaults?: NotizenDialogDefaults) => setNotizenDialog({ defaults }),
      openEdit: (record: Notizen) => setNotizenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Notizen) => detailNotizen(record, false),
    },
    enriched: { sitzungen: enrichedSitzungen, anmeldungen: enrichedAnmeldungen, protokolle: enrichedProtokolle, themenFeedback: enrichedThemenFeedback, notizen: enrichedNotizen },
  };
}

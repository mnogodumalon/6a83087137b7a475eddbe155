import type { Sitzungen, Mitglieder, Anmeldungen, Protokolle, ThemenFeedback, Notizen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface SitzungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Sitzungen;
  /** N:1-Ziel „Mitglieder": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitgliederList: Mitglieder[];
  /** Reserviert — Mitglieder ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenMitglieder?: (record: Mitglieder) => void;
  /** 1:N „Anmeldungen": VOLLE Liste — der Block filtert auf diesen Record. */
  anmeldungenList: Anmeldungen[];
  /** Zeilen-Klick → overlay.push auf das Anmeldungen-Detail (nie der Edit-Dialog). */
  onOpenAnmeldungen: (record: Anmeldungen) => void;
  /** Kontextuelles „+": öffnet den Anmeldungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnmeldungen: () => void;
  /** 1:N „Protokolle": VOLLE Liste — der Block filtert auf diesen Record. */
  protokolleList: Protokolle[];
  /** Zeilen-Klick → overlay.push auf das Protokolle-Detail (nie der Edit-Dialog). */
  onOpenProtokolle: (record: Protokolle) => void;
  /** Kontextuelles „+": öffnet den Protokolle-Dialog mit diesem Record vorgesetzt. */
  onAddProtokolle: () => void;
  /** 1:N „Themen & Feedback": VOLLE Liste — der Block filtert auf diesen Record. */
  themenFeedbackList: ThemenFeedback[];
  /** Zeilen-Klick → overlay.push auf das ThemenFeedback-Detail (nie der Edit-Dialog). */
  onOpenThemenFeedback: (record: ThemenFeedback) => void;
  /** Kontextuelles „+": öffnet den ThemenFeedback-Dialog mit diesem Record vorgesetzt. */
  onAddThemenFeedback: () => void;
  /** 1:N „Notizen": VOLLE Liste — der Block filtert auf diesen Record. */
  notizenList: Notizen[];
  /** Zeilen-Klick → overlay.push auf das Notizen-Detail (nie der Edit-Dialog). */
  onOpenNotizen: (record: Notizen) => void;
  /** Kontextuelles „+": öffnet den Notizen-Dialog mit diesem Record vorgesetzt. */
  onAddNotizen: () => void;
}

export function SitzungenDetails({
  record,
  mitgliederList,
  anmeldungenList,
  onOpenAnmeldungen,
  onAddAnmeldungen,
  protokolleList,
  onOpenProtokolle,
  onAddProtokolle,
  themenFeedbackList,
  onOpenThemenFeedback,
  onAddThemenFeedback,
  notizenList,
  onOpenNotizen,
  onAddNotizen,
}: SitzungenDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('sitzungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('sitzungen', 'datum')} value={record.fields.datum} format="datetime" />
        <RecordField label={fieldLabel('sitzungen', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('sitzungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('sitzungen', 'tagesordnung')} value={record.fields.tagesordnung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('sitzungen', 'mitglieder')} value={Array.isArray(record.fields.mitglieder) ? record.fields.mitglieder.map((u: unknown) => mitgliederList.find(t => t.record_id === extractRecordId(u))?.fields.vorname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('sitzungen', 'einlade_link')} value={record.fields.einlade_link} format="url" />
        <RecordField label={fieldLabel('sitzungen', 'einladung_versendet')} value={record.fields.einladung_versendet} format="bool" />
        <RecordField label={fieldLabel('sitzungen', 'sitzungsstatus')} value={record.fields.sitzungsstatus} format="pill" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anmeldungen')}
        items={anmeldungenList.filter(r => extractRecordId(r.fields.sitzung) === record.record_id)}
        map={r => ({ name: r.fields.vorname ?? appLabel('anmeldungen'), meta: undefined })}
        onOpen={onOpenAnmeldungen}
        onAdd={onAddAnmeldungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('protokolle')}
        items={protokolleList.filter(r => extractRecordId(r.fields.sitzung) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('protokolle'), meta: r.fields.erstellungsdatum })}
        onOpen={onOpenProtokolle}
        onAdd={onAddProtokolle}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('themen_feedback')}
        items={themenFeedbackList.filter(r => extractRecordId(r.fields.sitzung) === record.record_id)}
        map={r => ({ name: r.fields.thementitel ?? appLabel('themen_feedback'), meta: undefined })}
        onOpen={onOpenThemenFeedback}
        onAdd={onAddThemenFeedback}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('notizen')}
        items={notizenList.filter(r => extractRecordId(r.fields.sitzung) === record.record_id)}
        map={r => ({ name: r.fields.notiz_titel ?? appLabel('notizen'), meta: r.fields.notiz_datum })}
        onOpen={onOpenNotizen}
        onAdd={onAddNotizen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.SITZUNGEN} recordId={record.record_id} />
    </>
  );
}

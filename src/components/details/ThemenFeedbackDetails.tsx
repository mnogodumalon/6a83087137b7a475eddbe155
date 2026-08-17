import type { ThemenFeedback, Sitzungen, Mitglieder } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface ThemenFeedbackDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: ThemenFeedback;
  /** N:1-Ziel „Sitzungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  sitzungenList: Sitzungen[];
  /** Klick auf die Sitzungen-Relation → overlay.push auf dessen Detail. */
  onOpenSitzungen?: (record: Sitzungen) => void;
  /** N:1-Ziel „Mitglieder": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitgliederList: Mitglieder[];
  /** Klick auf die Mitglieder-Relation → overlay.push auf dessen Detail. */
  onOpenMitglieder?: (record: Mitglieder) => void;
}

export function ThemenFeedbackDetails({
  record,
  sitzungenList,
  onOpenSitzungen,
  mitgliederList,
  onOpenMitglieder,
}: ThemenFeedbackDetailsProps) {
  const sitzungTarget = sitzungenList.find(r => r.record_id === extractRecordId(record.fields.sitzung));
  const verantwortlicherTarget = mitgliederList.find(r => r.record_id === extractRecordId(record.fields.verantwortlicher));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('themen_feedback', 'thementitel')} value={record.fields.thementitel} format="text" />
        <RecordField label={fieldLabel('themen_feedback', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('themen_feedback', 'themenstatus')} value={record.fields.themenstatus} format="pill" />
        <RecordField label={fieldLabel('themen_feedback', 'feedback_text')} value={record.fields.feedback_text} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('themen_feedback', 'bewertung')} value={record.fields.bewertung} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('themen_feedback', 'sitzung')}
          name={sitzungTarget?.fields.titel ?? '—'}
          meta={[sitzungTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={sitzungTarget && onOpenSitzungen ? () => onOpenSitzungen!(sitzungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('themen_feedback', 'verantwortlicher')}
          name={verantwortlicherTarget?.fields.vorname ?? '—'}
          meta={[verantwortlicherTarget?.fields.email, verantwortlicherTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={verantwortlicherTarget && onOpenMitglieder ? () => onOpenMitglieder!(verantwortlicherTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.THEMEN_FEEDBACK} recordId={record.record_id} />
    </>
  );
}

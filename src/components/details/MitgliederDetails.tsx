import type { Mitglieder, Sitzungen, ThemenFeedback, Notizen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface MitgliederDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitglieder;
  /** 1:N „Sitzungen": VOLLE Liste — der Block filtert auf diesen Record. */
  sitzungenList: Sitzungen[];
  /** Zeilen-Klick → overlay.push auf das Sitzungen-Detail (nie der Edit-Dialog). */
  onOpenSitzungen: (record: Sitzungen) => void;
  /** Kontextuelles „+": öffnet den Sitzungen-Dialog mit diesem Record vorgesetzt. */
  onAddSitzungen: () => void;
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

export function MitgliederDetails({
  record,
  sitzungenList,
  onOpenSitzungen,
  onAddSitzungen,
  themenFeedbackList,
  onOpenThemenFeedback,
  onAddThemenFeedback,
  notizenList,
  onOpenNotizen,
  onAddNotizen,
}: MitgliederDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitglieder', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitglieder', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'funktion')} value={record.fields.funktion} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'abteilung')} value={record.fields.abteilung} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('sitzungen')}
        items={sitzungenList.filter(r => Array.isArray(r.fields.mitglieder) && r.fields.mitglieder.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('sitzungen'), meta: r.fields.datum })}
        onOpen={onOpenSitzungen}
        onAdd={onAddSitzungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('themen_feedback')}
        items={themenFeedbackList.filter(r => extractRecordId(r.fields.verantwortlicher) === record.record_id)}
        map={r => ({ name: r.fields.thementitel ?? appLabel('themen_feedback'), meta: undefined })}
        onOpen={onOpenThemenFeedback}
        onAdd={onAddThemenFeedback}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('notizen')}
        items={notizenList.filter(r => extractRecordId(r.fields.mitglied) === record.record_id)}
        map={r => ({ name: r.fields.notiz_titel ?? appLabel('notizen'), meta: r.fields.notiz_datum })}
        onOpen={onOpenNotizen}
        onAdd={onAddNotizen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITGLIEDER} recordId={record.record_id} />
    </>
  );
}

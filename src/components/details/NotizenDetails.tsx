import type { Notizen, Sitzungen, Protokolle, Mitglieder } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface NotizenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Notizen;
  /** N:1-Ziel „Sitzungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  sitzungenList: Sitzungen[];
  /** Klick auf die Sitzungen-Relation → overlay.push auf dessen Detail. */
  onOpenSitzungen?: (record: Sitzungen) => void;
  /** N:1-Ziel „Protokolle": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  protokolleList: Protokolle[];
  /** Klick auf die Protokolle-Relation → overlay.push auf dessen Detail. */
  onOpenProtokolle?: (record: Protokolle) => void;
  /** N:1-Ziel „Mitglieder": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitgliederList: Mitglieder[];
  /** Klick auf die Mitglieder-Relation → overlay.push auf dessen Detail. */
  onOpenMitglieder?: (record: Mitglieder) => void;
}

export function NotizenDetails({
  record,
  sitzungenList,
  onOpenSitzungen,
  protokolleList,
  onOpenProtokolle,
  mitgliederList,
  onOpenMitglieder,
}: NotizenDetailsProps) {
  const sitzungTarget = sitzungenList.find(r => r.record_id === extractRecordId(record.fields.sitzung));
  const protokollTarget = protokolleList.find(r => r.record_id === extractRecordId(record.fields.protokoll));
  const mitgliedTarget = mitgliederList.find(r => r.record_id === extractRecordId(record.fields.mitglied));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('notizen', 'notiz_titel')} value={record.fields.notiz_titel} format="text" />
        <RecordField label={fieldLabel('notizen', 'notiz_text')} value={record.fields.notiz_text} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('notizen', 'ersteller_vorname')} value={record.fields.ersteller_vorname} format="text" />
        <RecordField label={fieldLabel('notizen', 'ersteller_nachname')} value={record.fields.ersteller_nachname} format="text" />
        <RecordField label={fieldLabel('notizen', 'notiz_datum')} value={record.fields.notiz_datum} format="date" />
        <RecordField label={fieldLabel('notizen', 'notiz_typ')} value={record.fields.notiz_typ} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('notizen', 'sitzung')}
          name={sitzungTarget?.fields.titel ?? '—'}
          meta={[sitzungTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={sitzungTarget && onOpenSitzungen ? () => onOpenSitzungen!(sitzungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('notizen', 'protokoll')}
          name={protokollTarget?.fields.titel ?? '—'}
          meta={[protokollTarget?.fields.protokollfuehrer_vorname, protokollTarget?.fields.protokollfuehrer_nachname].filter(Boolean).join(' · ') || undefined}
          onClick={protokollTarget && onOpenProtokolle ? () => onOpenProtokolle!(protokollTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('notizen', 'mitglied')}
          name={mitgliedTarget?.fields.vorname ?? '—'}
          meta={[mitgliedTarget?.fields.email, mitgliedTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={mitgliedTarget && onOpenMitglieder ? () => onOpenMitglieder!(mitgliedTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.NOTIZEN} recordId={record.record_id} />
    </>
  );
}

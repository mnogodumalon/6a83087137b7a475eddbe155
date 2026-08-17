import type { Anmeldungen, Sitzungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface AnmeldungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anmeldungen;
  /** N:1-Ziel „Sitzungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  sitzungenList: Sitzungen[];
  /** Klick auf die Sitzungen-Relation → overlay.push auf dessen Detail. */
  onOpenSitzungen?: (record: Sitzungen) => void;
}

export function AnmeldungenDetails({
  record,
  sitzungenList,
  onOpenSitzungen,
}: AnmeldungenDetailsProps) {
  const sitzungTarget = sitzungenList.find(r => r.record_id === extractRecordId(record.fields.sitzung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anmeldungen', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('anmeldungen', 'organisation')} value={record.fields.organisation} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'teilnahme')} value={record.fields.teilnahme} format="pill" />
        <RecordField label={fieldLabel('anmeldungen', 'anmerkungen')} value={record.fields.anmerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('anmeldungen', 'sitzung')}
          name={sitzungTarget?.fields.titel ?? '—'}
          meta={[sitzungTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={sitzungTarget && onOpenSitzungen ? () => onOpenSitzungen!(sitzungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANMELDUNGEN} recordId={record.record_id} />
    </>
  );
}

import type { Protokolle, Sitzungen, Notizen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface ProtokolleDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Protokolle;
  /** N:1-Ziel „Sitzungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  sitzungenList: Sitzungen[];
  /** Klick auf die Sitzungen-Relation → overlay.push auf dessen Detail. */
  onOpenSitzungen?: (record: Sitzungen) => void;
  /** 1:N „Notizen": VOLLE Liste — der Block filtert auf diesen Record. */
  notizenList: Notizen[];
  /** Zeilen-Klick → overlay.push auf das Notizen-Detail (nie der Edit-Dialog). */
  onOpenNotizen: (record: Notizen) => void;
  /** Kontextuelles „+": öffnet den Notizen-Dialog mit diesem Record vorgesetzt. */
  onAddNotizen: () => void;
}

export function ProtokolleDetails({
  record,
  sitzungenList,
  onOpenSitzungen,
  notizenList,
  onOpenNotizen,
  onAddNotizen,
}: ProtokolleDetailsProps) {
  const sitzungTarget = sitzungenList.find(r => r.record_id === extractRecordId(record.fields.sitzung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('protokolle', 'protokollstatus')} value={record.fields.protokollstatus} format="pill" />
        <RecordField label={fieldLabel('protokolle', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('protokolle', 'erstellungsdatum')} value={record.fields.erstellungsdatum} format="date" />
        <RecordField label={fieldLabel('protokolle', 'protokollfuehrer_vorname')} value={record.fields.protokollfuehrer_vorname} format="text" />
        <RecordField label={fieldLabel('protokolle', 'protokollfuehrer_nachname')} value={record.fields.protokollfuehrer_nachname} format="text" />
        <RecordField label={fieldLabel('protokolle', 'inhalt')} value={record.fields.inhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('protokolle', 'beschluesse')} value={record.fields.beschluesse} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('protokolle', 'anhang')} className="md:col-span-2">
          {record.fields.anhang ? (
            <MediaThumbnail src={record.fields.anhang as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('protokolle', 'sitzung')}
          name={sitzungTarget?.fields.titel ?? '—'}
          meta={[sitzungTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={sitzungTarget && onOpenSitzungen ? () => onOpenSitzungen!(sitzungTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('notizen')}
        items={notizenList.filter(r => extractRecordId(r.fields.protokoll) === record.record_id)}
        map={r => ({ name: r.fields.notiz_titel ?? appLabel('notizen'), meta: r.fields.notiz_datum })}
        onOpen={onOpenNotizen}
        onAdd={onAddNotizen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.PROTOKOLLE} recordId={record.record_id} />
    </>
  );
}

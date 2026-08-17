import type { Protokolle, Sitzungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

interface ProtokolleViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Protokolle | null;
  onEdit: (record: Protokolle) => void;
  sitzungenList: Sitzungen[];
}

export function ProtokolleViewDialog({ open, onClose, record, onEdit, sitzungenList }: ProtokolleViewDialogProps) {
  function getSitzungenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return sitzungenList.find(r => r.record_id === id)?.fields.titel ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('protokolle') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'protokollstatus')}</Label>
            <Badge variant="secondary">{lookupLabel('protokolle', 'protokollstatus', record.fields.protokollstatus?.key) ?? record.fields.protokollstatus?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'titel')}</Label>
            <p className="text-sm">{record.fields.titel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'sitzung')}</Label>
            <p className="text-sm">{getSitzungenDisplayName(record.fields.sitzung)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'erstellungsdatum')}</Label>
            <p className="text-sm">{formatDate(record.fields.erstellungsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'protokollfuehrer_vorname')}</Label>
            <p className="text-sm">{record.fields.protokollfuehrer_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'protokollfuehrer_nachname')}</Label>
            <p className="text-sm">{record.fields.protokollfuehrer_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'inhalt')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.inhalt ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'beschluesse')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschluesse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('protokolle', 'anhang')}</Label>
            {record.fields.anhang ? (
              <MediaThumbnail src={record.fields.anhang} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.PROTOKOLLE} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
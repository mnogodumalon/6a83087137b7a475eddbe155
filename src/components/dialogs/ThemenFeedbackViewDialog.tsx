import type { ThemenFeedback, Sitzungen, Mitglieder } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel } from '@/i18n';

interface ThemenFeedbackViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: ThemenFeedback | null;
  onEdit: (record: ThemenFeedback) => void;
  sitzungenList: Sitzungen[];
  mitgliederList: Mitglieder[];
}

export function ThemenFeedbackViewDialog({ open, onClose, record, onEdit, sitzungenList, mitgliederList }: ThemenFeedbackViewDialogProps) {
  function getSitzungenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return sitzungenList.find(r => r.record_id === id)?.fields.titel ?? '—';
  }

  function getMitgliederDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitgliederList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('themen_feedback') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'thementitel')}</Label>
            <p className="text-sm">{record.fields.thementitel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'sitzung')}</Label>
            <p className="text-sm">{getSitzungenDisplayName(record.fields.sitzung)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'beschreibung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'verantwortlicher')}</Label>
            <p className="text-sm">{getMitgliederDisplayName(record.fields.verantwortlicher)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'themenstatus')}</Label>
            <Badge variant="secondary">{lookupLabel('themen_feedback', 'themenstatus', record.fields.themenstatus?.key) ?? record.fields.themenstatus?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'feedback_text')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.feedback_text ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('themen_feedback', 'bewertung')}</Label>
            <Badge variant="secondary">{lookupLabel('themen_feedback', 'bewertung', record.fields.bewertung?.key) ?? record.fields.bewertung?.label ?? '—'}</Badge>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.THEMEN_FEEDBACK} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
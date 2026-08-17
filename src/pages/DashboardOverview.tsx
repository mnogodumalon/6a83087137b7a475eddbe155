import { useDashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardSkeleton, DashboardError } from '@/components/DashboardStates';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { CalendarWidget, type CalendarEvent } from '@/components/widgets/CalendarWidget';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { lookupOption } from '@/types/app';
import { lookupKey, formatDate } from '@/lib/formatters';
import { LivingAppsService } from '@/services/livingAppsService';
import { useMemo } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import {
  IconCalendarEvent,
  IconUsers,
  IconMessageCircle,
  IconSend,
  IconClipboardList,
} from '@tabler/icons-react';

export default function DashboardOverview() {
  const data = useDashboardData();
  const {
    sitzungen, setSitzungen, anmeldungen, protokolle, themenFeedback,
    mitglieder, sitzungenMap,
    loading, error, fetchAll,
  } = data;

  const clock = useClock();
  const locale = dateFnsLocale();

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'sitzungen') {
        const s = sitzungen.find(r => r.record_id === top.record.record_id);
        const status = lookupKey(s?.fields.sitzungsstatus);
        if (status === 'geplant') {
          return {
            label: tx('Einladungen versenden'),
            onClick: () => sendEinladung(top.record.record_id),
          };
        }
        if (status === 'eingeladen') {
          return {
            label: tx('Als durchgeführt markieren'),
            onClick: () => markDurchgefuehrt(top.record.record_id),
          };
        }
      }
      return undefined;
    },
  });

  const enrichedSitzungen = crud.enriched.sitzungen;
  const enrichedThemenFeedback = crud.enriched.themenFeedback;
  const enrichedProtokolle = crud.enriched.protokolle;

  // ── Calendar events ───────────────────────────────────────────────────────
  const calendarEvents = useMemo<CalendarEvent[]>(() =>
    enrichedSitzungen
      .filter(s => !!s.fields.datum)
      .map(s => {
        const status = lookupKey(s.fields.sitzungsstatus);
        return {
          id: `sitzung:${s.record_id}`,
          start: s.fields.datum!,
          title: s.fields.titel ?? tx('Ohne Titel'),
          subtitle: s.fields.ort ?? undefined,
          tone: status === 'abgesagt' ? 'destructive' as const
            : status === 'durchgefuehrt' ? 'success' as const
            : status === 'eingeladen' ? 'primary' as const
            : 'default' as const,
        };
      }),
    [enrichedSitzungen],
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const today = startOfDay(clock);
  const naechste7Tage = addDays(today, 7);

  const bald = useMemo(() =>
    sitzungen.filter(s => {
      if (!s.fields.datum) return false;
      const d = parseISO(s.fields.datum);
      return isAfter(d, today) && isBefore(d, naechste7Tage);
    }),
    [sitzungen, today, naechste7Tage],
  );

  const offeneThemen = useMemo(() =>
    themenFeedback.filter(t => {
      const k = lookupKey(t.fields.themenstatus);
      return k === 'offen' || k === 'in_bearbeitung';
    }),
    [themenFeedback],
  );

  const protokolleEntwurf = useMemo(() =>
    protokolle.filter(p => lookupKey(p.fields.protokollstatus) === 'entwurf'),
    [protokolle],
  );

  const nichtEingeladen = useMemo(() =>
    sitzungen.filter(s => {
      const k = lookupKey(s.fields.sitzungsstatus);
      return k === 'geplant' && !s.fields.einladung_versendet;
    }),
    [sitzungen],
  );

  // ── Hero: nächste ungeplante Einladung ────────────────────────────────────
  const heroBanner = nichtEingeladen.length > 0 ? nichtEingeladen[0] : null;
  const heroTitel = heroBanner?.fields.titel ?? '';
  const heroDatum = heroBanner?.fields.datum ? formatDate(heroBanner.fields.datum) : '';

  // ── Context line ──────────────────────────────────────────────────────────
  const aktiveMitglieder = mitglieder.filter(m => lookupKey(m.fields.status) === 'aktiv');
  const baldNamen = namen(bald.map(s => s.fields.titel ?? ''));

  // ── Advance helpers ────────────────────────────────────────────────────────
  async function sendEinladung(sitzungId: string) {
    const prev = sitzungen.find(s => s.record_id === sitzungId);
    if (!prev) return;
    setSitzungen(old => old.map(s =>
      s.record_id === sitzungId
        ? { ...s, fields: { ...s.fields, sitzungsstatus: lookupOption('sitzungen', 'sitzungsstatus', 'eingeladen'), einladung_versendet: true } }
        : s,
    ));
    undoToast(tx`${heroTitel || prev.fields.titel || ''} — Einladung versendet`, async () => {
      setSitzungen(old => old.map(s => s.record_id === sitzungId ? prev : s));
      await LivingAppsService.updateSitzungenEntry(sitzungId, { sitzungsstatus: 'geplant', einladung_versendet: false });
    });
    try {
      await LivingAppsService.updateSitzungenEntry(sitzungId, { sitzungsstatus: 'eingeladen', einladung_versendet: true });
    } catch {
      await fetchAll();
    }
  }

  async function markDurchgefuehrt(sitzungId: string) {
    const prev = sitzungen.find(s => s.record_id === sitzungId);
    if (!prev) return;
    const titel = prev.fields.titel ?? '';
    setSitzungen(old => old.map(s =>
      s.record_id === sitzungId
        ? { ...s, fields: { ...s.fields, sitzungsstatus: lookupOption('sitzungen', 'sitzungsstatus', 'durchgefuehrt') } }
        : s,
    ));
    undoToast(tx`${titel} — als durchgeführt markiert`, async () => {
      setSitzungen(old => old.map(s => s.record_id === sitzungId ? prev : s));
      await LivingAppsService.updateSitzungenEntry(sitzungId, { sitzungsstatus: 'eingeladen' });
    });
    try {
      await LivingAppsService.updateSitzungenEntry(sitzungId, { sitzungsstatus: 'durchgefuehrt' });
    } catch {
      await fetchAll();
    }
  }

  // ── Calendar: reschedule on drag ──────────────────────────────────────────
  const handleEventDrop = async (eventId: string, newStart: string) => {
    const rid = eventId.split(':')[1];
    if (!rid) return;
    const prev = sitzungen.find(s => s.record_id === rid);
    if (!prev) return;
    const titel = prev.fields.titel ?? '';
    const newDate = newStart.slice(0, 10);
    setSitzungen(old => old.map(s =>
      s.record_id === rid
        ? { ...s, fields: { ...s.fields, datum: newDate } }
        : s,
    ));
    undoToast(tx`${titel} — verschoben auf ${formatDate(newDate)}`, async () => {
      setSitzungen(old => old.map(s => s.record_id === rid ? prev : s));
      await LivingAppsService.updateSitzungenEntry(rid, { datum: prev.fields.datum ?? '' });
    });
    try {
      await LivingAppsService.updateSitzungenEntry(rid, { datum: newDate });
    } catch {
      await fetchAll();
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // ── Aside: offene Themen & Protokollentwürfe ───────────────────────────────
  const themenItems = enrichedThemenFeedback
    .filter(t => {
      const k = lookupKey(t.fields.themenstatus);
      return k === 'offen' || k === 'in_bearbeitung';
    })
    .slice(0, 6)
    .map(t => ({
      id: t.record_id,
      title: t.fields.thementitel ?? tx('Ohne Titel'),
      secondLine: (
        <span className="flex gap-1 text-xs">
          <span className={lookupKey(t.fields.themenstatus) === 'in_bearbeitung' ? 'text-amber-600 font-medium' : 'text-muted-foreground font-medium'}>
            {t.fields.themenstatus?.label ?? ''}
          </span>
          {t.sitzungName ? <span className="text-muted-foreground"> · {t.sitzungName}</span> : null}
        </span>
      ),
    }));

  const protokollItems = enrichedProtokolle
    .filter(p => lookupKey(p.fields.protokollstatus) === 'entwurf')
    .slice(0, 5)
    .map(p => ({
      id: p.record_id,
      title: p.fields.titel ?? tx('Ohne Titel'),
      secondLine: (
        <span className="flex gap-1 text-xs">
          <span className="text-amber-600 font-medium">{tx('Entwurf')}</span>
          {p.sitzungName ? <span className="text-muted-foreground"> · {p.sitzungName}</span> : null}
        </span>
      ),
      action: {
        label: tx('Freigeben'),
        onClick: async () => {
          const prev = protokolle.find(pr => pr.record_id === p.record_id);
          if (!prev) return;
          undoToast(tx`${p.fields.titel ?? ''} — freigegeben`, async () => {
            await LivingAppsService.updateProtokolleEntry(p.record_id, { protokollstatus: 'entwurf' });
            await fetchAll();
          });
          try {
            await LivingAppsService.updateProtokolleEntry(p.record_id, { protokollstatus: 'freigegeben' });
            await fetchAll();
          } catch {
            await fetchAll();
          }
        },
      },
    }));

  const contextLine = bald.length > 0
    ? tx`${gruss(clock)} ${baldNamen} — ${bald.length === 1 ? tx('eine Sitzung') : tx`${bald.length} Sitzungen`} in den nächsten 7 Tagen.`
    : tx`${gruss(clock)} ${aktiveMitglieder.length} aktive Mitglieder, ${sitzungen.filter(s => lookupKey(s.fields.sitzungsstatus) === 'geplant').length} geplante Sitzungen.`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{appLabel('sitzungen')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{contextLine}</p>
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          heroBanner && (
            <HeroBanner
              icon={<IconSend size={18} />}
              action={{ label: tx('Einladung versenden'), onClick: () => sendEinladung(heroBanner.record_id) }}
            >
              <b>{heroTitel}</b>
              {heroDatum ? tx` am ${heroDatum}` : ''} — {tx('Einladung noch nicht versendet.')}
            </HeroBanner>
          )
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={appLabel('sitzungen')}
              value={sitzungen.length}
              icon={<IconCalendarEvent size={16} className="shrink-0" />}
              tone="default"
            />
            <StatStripItem
              title={tx('Bald (7 Tage)')}
              value={bald.length}
              icon={<IconCalendarEvent size={16} className="shrink-0" />}
              tone={bald.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Ohne Einladung')}
              value={nichtEingeladen.length}
              icon={<IconSend size={16} className="shrink-0" />}
              tone={nichtEingeladen.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={appLabel('mitglieder')}
              value={aktiveMitglieder.length}
              icon={<IconUsers size={16} className="shrink-0" />}
              tone="default"
            />
            <StatStripItem
              title={tx('Offene Themen')}
              value={offeneThemen.length}
              icon={<IconMessageCircle size={16} className="shrink-0" />}
              tone={offeneThemen.length > 3 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Protokollentwürfe')}
              value={protokolleEntwurf.length}
              icon={<IconClipboardList size={16} className="shrink-0" />}
              tone={protokolleEntwurf.length > 0 ? 'warning' : 'default'}
            />
          </StatStrip>
        }
        primary={
          <CalendarWidget
            events={calendarEvents}
            locale={locale}
            defaultView="month"
            onEventClick={ev => {
              const rid = ev.id.split(':')[1];
              const rec = sitzungen.find(s => s.record_id === rid);
              if (rec) crud.sitzungen.openDetail(rec);
            }}
            onEmptyClick={d => crud.sitzungen.openCreate({ datum: format(d, 'yyyy-MM-dd') })}
            onEventDrop={handleEventDrop}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Offene Themen & Feedback')}
              items={themenItems}
              onItemClick={id => {
                const rec = themenFeedback.find(t => t.record_id === id);
                if (rec) crud.themenFeedback.openDetail(rec);
              }}
              empty={{
                text: tx('Alle Themen geklärt — prima!'),
                action: { label: tx('Thema hinzufügen'), onClick: () => crud.themenFeedback.openCreate({}) },
              }}
            />
            <WorkList
              title={tx('Protokollentwürfe zur Freigabe')}
              items={protokollItems}
              onItemClick={id => {
                const rec = protokolle.find(p => p.record_id === id);
                if (rec) crud.protokolle.openDetail(rec);
              }}
              empty={{
                text: tx('Alle Protokolle freigegeben.'),
                action: { label: tx('Protokoll erstellen'), onClick: () => crud.protokolle.openCreate({}) },
              }}
            />
          </>
        }
      />

      {crud.surfaces}
    </div>
  );
}

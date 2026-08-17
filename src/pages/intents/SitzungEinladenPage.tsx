/**
 * Sitzung Einladen — 3-Schritt-Wizard.
 * Steps: 1) Sitzung wählen (nur 'geplant') → 2) Einlade-Link & Mitglieder erfassen
 *        → 3) Bestätigen & Sitzung als 'eingeladen' speichern.
 * Reads: sitzungen, mitglieder. Writes: sitzungen (updateSitzungenEntry).
 * Composes: IntentWizardShell, EntitySelectStep.
 */
import { useState } from 'react';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Sitzungen, Mitglieder } from '@/types/app';
import { formatDate } from '@/lib/formatters';
import { tx } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconCalendar, IconMapPin, IconUsers, IconLink, IconSend, IconCheck } from '@tabler/icons-react';

export default function SitzungEinladenPage() {
  const data = useDashboardData();
  const { sitzungen, mitglieder, loading, error, fetchAll } = data;

  const [step, setStep] = useState(1);
  const [selectedSitzung, setSelectedSitzung] = useState<Sitzungen | null>(null);
  const [einladeLink, setEinladeLink] = useState('');
  const [selectedMitgliederIds, setSelectedMitgliederIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mitgliederSearch, setMitgliederSearch] = useState('');

  // Filter: nur Sitzungen mit sitzungsstatus='geplant'
  const geplantesSitzungen = sitzungen.filter(
    (s) => s.fields.sitzungsstatus?.key === 'geplant'
  );

  const handleSelectSitzung = (id: string) => {
    const sitzung = sitzungen.find((s) => s.record_id === id);
    if (!sitzung) return;
    setSelectedSitzung(sitzung);
    // Vorausfüllen mit bestehenden Werten
    setEinladeLink(sitzung.fields.einlade_link ?? '');
    // Bestehende Mitglieder aus dem Array von Record-URLs extrahieren
    const bestehendeIds = new Set<string>();
    (sitzung.fields.mitglieder ?? []).forEach((url) => {
      // URL-Format: .../records/{id}
      const parts = url.split('/');
      const id = parts[parts.length - 1];
      if (id) bestehendeIds.add(id);
    });
    setSelectedMitgliederIds(bestehendeIds);
    setStep(2);
  };

  const toggleMitglied = (id: string) => {
    setSelectedMitgliederIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedSitzung) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const mitgliederUrls = Array.from(selectedMitgliederIds).map((id) =>
        createRecordUrl(APP_IDS.MITGLIEDER, id)
      );
      await LivingAppsService.updateSitzungenEntry(selectedSitzung.record_id, {
        einlade_link: einladeLink || undefined,
        mitglieder: mitgliederUrls.length > 0 ? mitgliederUrls : undefined,
        einladung_versendet: true,
        sitzungsstatus: 'eingeladen',
      });
      await fetchAll();
      setSuccess(true);
    } catch (e) {
      setSaveError(tx('Fehler beim Speichern. Bitte erneut versuchen.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedSitzung(null);
    setEinladeLink('');
    setSelectedMitgliederIds(new Set());
    setSaveError(null);
    setSuccess(false);
    setMitgliederSearch('');
    setStep(1);
  };

  const filteredMitglieder: Mitglieder[] = mitglieder.filter((m) => {
    const q = mitgliederSearch.toLowerCase();
    if (!q) return true;
    const name = `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.toLowerCase();
    return name.includes(q) || (m.fields.email ?? '').toLowerCase().includes(q);
  });

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-100 p-4">
            <IconCheck size={40} className="text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">{tx('Einladung gespeichert!')}</h2>
        <p className="text-muted-foreground">
          {tx('Die Sitzung wurde als „Eingeladen" markiert und der Einlade-Link wurde gespeichert.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleReset} variant="outline">
            {tx('Weitere Sitzung einladen')}
          </Button>
          <Button asChild>
            <a href="#/">{tx('Zurück zum Dashboard')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <IntentWizardShell
      title={tx('Sitzung einladen')}
      subtitle={tx('Einlade-Link setzen und Mitglieder informieren')}
      steps={[
        { label: tx('Sitzung wählen') },
        { label: tx('Einladung vorbereiten') },
        { label: tx('Versenden') },
      ]}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* Schritt 1: Sitzung wählen */}
      {step === 1 && (
        <EntitySelectStep
          items={geplantesSitzungen.map((s) => ({
            id: s.record_id,
            title: s.fields.titel ?? tx('Ohne Titel'),
            subtitle: [
              s.fields.datum ? formatDate(s.fields.datum) : null,
              s.fields.ort ? s.fields.ort : null,
            ]
              .filter(Boolean)
              .join(' · '),
            status: s.fields.sitzungsstatus
              ? { key: s.fields.sitzungsstatus.key, label: s.fields.sitzungsstatus.label }
              : undefined,
            stats: [
              {
                label: tx('Mitglieder'),
                value: String(s.fields.mitglieder?.length ?? 0),
              },
            ],
            icon: <IconCalendar size={20} className="text-primary" />,
          }))}
          onSelect={handleSelectSitzung}
          searchPlaceholder={tx('Sitzung suchen …')}
          emptyText={tx('Keine geplanten Sitzungen vorhanden')}
          emptyIcon={<IconCalendar size={32} className="text-muted-foreground" />}
        />
      )}

      {/* Schritt 2: Einlade-Link & Mitglieder */}
      {step === 2 && (
        selectedSitzung ? (
          <div className="space-y-6">
            {/* Sitzungs-Info */}
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <div className="flex items-start gap-3">
                <IconCalendar size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{selectedSitzung.fields.titel ?? tx('Ohne Titel')}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    {selectedSitzung.fields.datum && (
                      <span className="flex items-center gap-1">
                        <IconCalendar size={14} className="shrink-0" />
                        {formatDate(selectedSitzung.fields.datum)}
                      </span>
                    )}
                    {selectedSitzung.fields.ort && (
                      <span className="flex items-center gap-1">
                        <IconMapPin size={14} className="shrink-0" />
                        {selectedSitzung.fields.ort}
                      </span>
                    )}
                  </div>
                </div>
                {selectedSitzung.fields.sitzungsstatus && (
                  <StatusBadge
                    statusKey={selectedSitzung.fields.sitzungsstatus.key}
                    label={selectedSitzung.fields.sitzungsstatus.label}
                    className="shrink-0 ml-auto"
                  />
                )}
              </div>
            </div>

            {/* Einlade-Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <IconLink size={16} className="text-muted-foreground shrink-0" />
                {tx('Öffentlicher Einlade-Link')}
              </label>
              <Input
                type="url"
                value={einladeLink}
                onChange={(e) => setEinladeLink(e.target.value)}
                placeholder={tx('https://…')}
              />
              <p className="text-xs text-muted-foreground">
                {tx('Z.B. die URL zur öffentlichen Anmeldeseite dieser Sitzung')}
              </p>
            </div>

            {/* Mitglieder auswählen */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <IconUsers size={16} className="text-muted-foreground shrink-0" />
                {tx('Einzuladende Mitglieder')}
                <span className="ml-auto text-muted-foreground font-normal">
                  {selectedMitgliederIds.size} {tx('ausgewählt')}
                </span>
              </label>
              <Input
                value={mitgliederSearch}
                onChange={(e) => setMitgliederSearch(e.target.value)}
                placeholder={tx('Mitglied suchen …')}
              />
              <div className="rounded-xl border divide-y max-h-64 overflow-y-auto">
                {filteredMitglieder.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {tx('Keine Mitglieder gefunden')}
                  </p>
                ) : (
                  filteredMitglieder.map((m) => {
                    const isSelected = selectedMitgliederIds.has(m.record_id);
                    const fullName = [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || m.record_id;
                    return (
                      <button
                        key={m.record_id}
                        type="button"
                        onClick={() => toggleMitglied(m.record_id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                        }`}>
                          {isSelected && <IconCheck size={12} className="text-primary-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{fullName}</p>
                          {(m.fields.funktion || m.fields.abteilung) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[m.fields.funktion, m.fields.abteilung].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {mitglieder.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMitgliederIds(new Set(mitglieder.map((m) => m.record_id)))}
                  >
                    {tx('Alle auswählen')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMitgliederIds(new Set())}
                  >
                    {tx('Auswahl aufheben')}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                {tx('Zurück')}
              </Button>
              <Button onClick={() => setStep(3)}>
                {tx('Weiter zu Schritt 3')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              {tx('Neu starten')}
            </Button>
          </div>
        )
      )}

      {/* Schritt 3: Bestätigen & versenden */}
      {step === 3 && (
        selectedSitzung ? (
          <div className="space-y-6">
            {/* Zusammenfassung */}
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-base">{tx('Zusammenfassung')}</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <IconCalendar size={18} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{tx('Sitzung')}</p>
                    <p className="font-medium truncate">{selectedSitzung.fields.titel ?? tx('Ohne Titel')}</p>
                    {selectedSitzung.fields.datum && (
                      <p className="text-sm text-muted-foreground">{formatDate(selectedSitzung.fields.datum)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IconLink size={18} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{tx('Einlade-Link')}</p>
                    {einladeLink ? (
                      <p className="text-sm break-all">{einladeLink}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">{tx('Kein Link angegeben')}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IconUsers size={18} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{tx('Eingeladene Mitglieder')}</p>
                    {selectedMitgliederIds.size === 0 ? (
                      <p className="text-sm text-muted-foreground italic">{tx('Keine Mitglieder ausgewählt')}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(selectedMitgliederIds).map((id) => {
                          const m = mitglieder.find((m) => m.record_id === id);
                          const name = m
                            ? [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ')
                            : id;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-amber-50 border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                {tx('Die Sitzung wird als „Eingeladen" markiert und der Status kann danach nicht mehr auf „Geplant" zurückgesetzt werden.')}
              </p>
            </div>

            {saveError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{saveError}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSaving}>
                {tx('Zurück')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <IconSend size={16} className="shrink-0" />
                {isSaving ? tx('Wird gespeichert …') : tx('Einladung speichern')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              {tx('Neu starten')}
            </Button>
          </div>
        )
      )}
    </IntentWizardShell>
  );
}

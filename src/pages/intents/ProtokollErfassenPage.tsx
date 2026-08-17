/**
 * Protokoll erfassen — 3-Schritt-Wizard.
 * Steps: 1) Sitzung wählen (nur Status 'durchgefuehrt') →
 *        2) Protokoll schreiben (Mini-Form mit Titel, Datum, Protokollführer, Inhalt, Beschlüsse, Status) →
 *        3) Speichern & Protokolleintrag anlegen.
 * Reads: sitzungen. Writes: protokolle (createProtokolleEntry).
 * Composes: IntentWizardShell, EntitySelectStep.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { IconFileText, IconCalendar, IconCheck } from '@tabler/icons-react';
import { tx } from '@/i18n';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import type { Sitzungen } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatDate } from '@/lib/formatters';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProtokollErfassenPage() {
  const data = useDashboardData();
  const { sitzungen, loading, error, fetchAll } = data;

  const [step, setStep] = useState(1);
  const [selectedSitzung, setSelectedSitzung] = useState<Sitzungen | null>(null);

  // Schritt 2 — Formularfelder
  const [titel, setTitel] = useState('');
  const [erstellungsdatum, setErstellungsdatum] = useState('');
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [beschluesse, setBeschluesse] = useState('');
  const [protokollstatusKey, setProtokollstatusKey] = useState(
    LOOKUP_OPTIONS['protokolle']?.['protokollstatus']?.[0]?.key ?? 'entwurf'
  );

  // Schritt 3 — Speicherstatus
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const PROTOKOLLSTATUS = LOOKUP_OPTIONS['protokolle']?.['protokollstatus'] ?? [];

  const abgehaltene = sitzungen.filter(
    s => s.fields.sitzungsstatus?.key === 'durchgefuehrt'
  );

  const handleSitzungSelect = (id: string) => {
    const sitzung = sitzungen.find(s => s.record_id === id) ?? null;
    setSelectedSitzung(sitzung);
    // Vorschlagswerte für Schritt 2 setzen
    setTitel(sitzung?.fields.titel ?? '');
    setErstellungsdatum(format(new Date(), 'yyyy-MM-dd'));
    setStep(2);
  };

  const schritt2Komplett =
    titel.trim() !== '' &&
    erstellungsdatum !== '' &&
    vorname.trim() !== '' &&
    nachname.trim() !== '' &&
    inhalt.trim() !== '' &&
    protokollstatusKey !== '';

  const handleSpeichern = async () => {
    if (!selectedSitzung) return;
    if (savedId) {
      // bereits gespeichert — idempotent
      setStep(3);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await LivingAppsService.createProtokolleEntry({
        sitzung: createRecordUrl(APP_IDS.SITZUNGEN, selectedSitzung.record_id),
        titel,
        erstellungsdatum,
        protokollfuehrer_vorname: vorname,
        protokollfuehrer_nachname: nachname,
        inhalt,
        beschluesse: beschluesse.trim() !== '' ? beschluesse : undefined,
        protokollstatus: protokollstatusKey,
      });
      setSavedId(result.record_id);
      await fetchAll();
      setStep(3);
    } catch (err) {
      setSaveError(tx('Protokoll konnte nicht gespeichert werden. Bitte versuche es erneut.'));
    } finally {
      setSaving(false);
    }
  };

  const handleNeuStarten = () => {
    setStep(1);
    setSelectedSitzung(null);
    setTitel('');
    setErstellungsdatum('');
    setVorname('');
    setNachname('');
    setInhalt('');
    setBeschluesse('');
    setProtokollstatusKey(PROTOKOLLSTATUS[0]?.key ?? 'entwurf');
    setSaving(false);
    setSaveError(null);
    setSavedId(null);
  };

  const steps = [
    { label: tx('Sitzung wählen') },
    { label: tx('Protokoll schreiben') },
    { label: tx('Speichern') },
  ];

  return (
    <IntentWizardShell
      title={tx('Protokoll erfassen')}
      subtitle={tx('Sitzungsprotokoll in drei Schritten anlegen')}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ── Schritt 1: Sitzung wählen ── */}
      {step === 1 && (
        <EntitySelectStep
          items={abgehaltene.map(s => ({
            id: s.record_id,
            title: s.fields.titel ?? tx('Ohne Titel'),
            subtitle: s.fields.datum
              ? formatDate(s.fields.datum)
              : tx('Kein Datum'),
            status: s.fields.sitzungsstatus
              ? { key: s.fields.sitzungsstatus.key, label: s.fields.sitzungsstatus.label }
              : undefined,
            icon: <IconCalendar size={20} className="text-primary" />,
          }))}
          onSelect={handleSitzungSelect}
          searchPlaceholder={tx('Sitzung suchen …')}
          emptyText={tx('Keine abgehaltenen Sitzungen vorhanden')}
          emptyIcon={<IconCalendar size={40} className="text-muted-foreground" />}
        />
      )}

      {/* ── Schritt 2: Protokoll schreiben ── */}
      {step === 2 && (
        selectedSitzung ? (
          <div className="space-y-6">
            {/* Gewählte Sitzung anzeigen */}
            <div className="rounded-2xl border bg-secondary/40 p-4 flex items-start gap-3">
              <IconCalendar size={20} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">{selectedSitzung.fields.titel ?? tx('Ohne Titel')}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSitzung.fields.datum
                    ? formatDate(selectedSitzung.fields.datum)
                    : tx('Kein Datum')}
                </p>
              </div>
              {selectedSitzung.fields.sitzungsstatus && (
                <StatusBadge
                  statusKey={selectedSitzung.fields.sitzungsstatus.key}
                  label={selectedSitzung.fields.sitzungsstatus.label}
                  className="shrink-0"
                />
              )}
            </div>

            {/* Mini-Form */}
            <div className="space-y-4">
              {/* Titel */}
              <div className="space-y-1.5">
                <Label htmlFor="protokoll-titel">
                  {tx('Protokolltitel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="protokoll-titel"
                  value={titel}
                  onChange={e => setTitel(e.target.value)}
                  placeholder={tx('z. B. Protokoll Vorstandssitzung März')}
                />
              </div>

              {/* Erstellungsdatum */}
              <div className="space-y-1.5">
                <Label htmlFor="protokoll-datum">
                  {tx('Erstellungsdatum')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="protokoll-datum"
                  type="date"
                  value={erstellungsdatum}
                  onChange={e => setErstellungsdatum(e.target.value)}
                />
              </div>

              {/* Protokollführer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="protokoll-vorname">
                    {tx('Vorname Protokollführer')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="protokoll-vorname"
                    value={vorname}
                    onChange={e => setVorname(e.target.value)}
                    placeholder={tx('Vorname')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="protokoll-nachname">
                    {tx('Nachname Protokollführer')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="protokoll-nachname"
                    value={nachname}
                    onChange={e => setNachname(e.target.value)}
                    placeholder={tx('Nachname')}
                  />
                </div>
              </div>

              {/* Inhalt */}
              <div className="space-y-1.5">
                <Label htmlFor="protokoll-inhalt">
                  {tx('Protokolltext')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="protokoll-inhalt"
                  value={inhalt}
                  onChange={e => setInhalt(e.target.value)}
                  placeholder={tx('Verlauf der Sitzung, Diskussionen, Ergebnisse …')}
                  rows={6}
                />
              </div>

              {/* Beschlüsse */}
              <div className="space-y-1.5">
                <Label htmlFor="protokoll-beschluesse">
                  {tx('Beschlüsse')}
                  <span className="ml-1.5 text-xs text-muted-foreground">({tx('optional')})</span>
                </Label>
                <Textarea
                  id="protokoll-beschluesse"
                  value={beschluesse}
                  onChange={e => setBeschluesse(e.target.value)}
                  placeholder={tx('Gefasste Beschlüsse und Abstimmungsergebnisse …')}
                  rows={3}
                />
              </div>

              {/* Protokollstatus */}
              <div className="space-y-1.5">
                <Label htmlFor="protokoll-status">
                  {tx('Status')} <span className="text-destructive">*</span>
                </Label>
                <Select value={protokollstatusKey} onValueChange={setProtokollstatusKey}>
                  <SelectTrigger id="protokoll-status">
                    <SelectValue placeholder={tx('Status wählen')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOKOLLSTATUS.map(opt => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                {tx('Zurück')}
              </Button>
              <Button
                disabled={!schritt2Komplett}
                onClick={() => setStep(3)}
              >
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

      {/* ── Schritt 3: Speichern ── */}
      {step === 3 && (
        selectedSitzung ? (
          savedId ? (
            /* Erfolg */
            <div className="space-y-6">
              <div className="rounded-2xl border bg-secondary/40 p-6 flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-emerald-100 p-3">
                  <IconCheck size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{tx('Protokoll gespeichert')}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tx('Das Protokoll wurde erfolgreich angelegt.')}
                  </p>
                </div>
                <div className="w-full rounded-xl border bg-card p-4 text-left space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{tx('Zusammenfassung')}</p>
                  <p className="font-medium">{titel}</p>
                  <p className="text-sm text-muted-foreground">
                    {tx('Sitzung')}: {selectedSitzung.fields.titel ?? tx('Ohne Titel')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tx('Protokollführer')}: {vorname} {nachname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tx('Status')}: {PROTOKOLLSTATUS.find(o => o.key === protokollstatusKey)?.label ?? protokollstatusKey}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleNeuStarten}>
                  {tx('Weiteres Protokoll erfassen')}
                </Button>
                <Button variant="outline" asChild>
                  <a href="#/">{tx('Zurück zum Dashboard')}</a>
                </Button>
              </div>
            </div>
          ) : (
            /* Vorschau & Absenden */
            <div className="space-y-6">
              {/* Zusammenfassung */}
              <div className="rounded-2xl border bg-secondary/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IconFileText size={16} className="shrink-0" />
                  {tx('Protokoll prüfen')}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-sm text-muted-foreground">{tx('Titel')}</span>
                    <span className="text-sm font-medium">{titel || '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-sm text-muted-foreground">{tx('Sitzung')}</span>
                    <span className="text-sm font-medium">
                      {selectedSitzung.fields.titel ?? tx('Ohne Titel')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-sm text-muted-foreground">{tx('Datum')}</span>
                    <span className="text-sm font-medium">{erstellungsdatum || '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-sm text-muted-foreground">{tx('Protokollführer')}</span>
                    <span className="text-sm font-medium">{vorname} {nachname}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-sm text-muted-foreground">{tx('Status')}</span>
                    <span className="text-sm font-medium">
                      {PROTOKOLLSTATUS.find(o => o.key === protokollstatusKey)?.label ?? protokollstatusKey}
                    </span>
                  </div>
                  {inhalt && (
                    <div className="pt-1">
                      <p className="text-sm text-muted-foreground mb-1">{tx('Inhalt')}</p>
                      <p className="text-sm whitespace-pre-wrap line-clamp-4 bg-card rounded-lg p-3 border">
                        {inhalt}
                      </p>
                    </div>
                  )}
                  {beschluesse && (
                    <div className="pt-1">
                      <p className="text-sm text-muted-foreground mb-1">{tx('Beschlüsse')}</p>
                      <p className="text-sm whitespace-pre-wrap line-clamp-3 bg-card rounded-lg p-3 border">
                        {beschluesse}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setStep(2)} disabled={saving}>
                  {tx('Zurück')}
                </Button>
                <Button onClick={handleSpeichern} disabled={saving}>
                  {saving ? tx('Wird gespeichert …') : tx('Protokoll speichern')}
                </Button>
              </div>
            </div>
          )
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

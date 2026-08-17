/**
 * Sitzung vorbereiten — 3-Schritt-Wizard.
 * Steps: 1) Sitzung anlegen → 2) Themen erfassen → 3) Mitglieder zuweisen.
 * Reads: mitglieder. Writes: sitzungen (createSitzungenEntry, updateSitzungenEntry),
 *        themenFeedback (createThemenFeedbackEntry).
 * Composes: IntentWizardShell.
 */
import { useState } from 'react';
import { tx } from '@/i18n';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { useDashboardData } from '@/hooks/useDashboardData';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  IconCalendarEvent,
  IconMapPin,
  IconPlus,
  IconTrash,
  IconCheck,
  IconUsers,
  IconAlertCircle,
} from '@tabler/icons-react';

export default function SitzungVorbereitenPage() {
  const { mitglieder, loading, error, fetchAll } = useDashboardData();

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1 — form fields
  const [titel, setTitel] = useState('');
  const [datum, setDatum] = useState('');
  const [ort, setOrt] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [tagesordnung, setTagesordnung] = useState('');
  const [savingStep1, setSavingStep1] = useState(false);
  const [errorStep1, setErrorStep1] = useState<string | null>(null);
  const [sitzungId, setSitzungId] = useState<string | null>(null);

  // Step 2 — thema form
  const [thementitel, setThementitel] = useState('');
  const [themaBeschreibung, setThemaBeschreibung] = useState('');
  const [verantwortlicherId, setVerantwortlicherId] = useState('');
  const [addedThemen, setAddedThemen] = useState<string[]>([]);
  const [savingThema, setSavingThema] = useState(false);
  const [errorStep2, setErrorStep2] = useState<string | null>(null);

  // Step 3 — member selection
  const [selectedMitglieder, setSelectedMitglieder] = useState<Set<string>>(new Set());
  const [savingStep3, setSavingStep3] = useState(false);
  const [errorStep3, setErrorStep3] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const aktiveMitglieder = mitglieder.filter(m => m.fields.status?.key === 'aktiv');

  // Step 1: Create the Sitzung
  const handleCreateSitzung = async () => {
    if (!titel.trim() || !datum) return;
    setSavingStep1(true);
    setErrorStep1(null);
    try {
      const result = await LivingAppsService.createSitzungenEntry({
        titel,
        datum,
        ort: ort || undefined,
        beschreibung: beschreibung || undefined,
        tagesordnung: tagesordnung || undefined,
        sitzungsstatus: 'geplant',
      });
      setSitzungId(result.record_id);
      setStep(2);
    } catch {
      setErrorStep1(tx('Fehler beim Anlegen der Sitzung. Bitte erneut versuchen.'));
    } finally {
      setSavingStep1(false);
    }
  };

  // Step 2: Add a Thema
  const handleAddThema = async () => {
    if (!thementitel.trim() || !sitzungId) return;
    setSavingThema(true);
    setErrorStep2(null);
    try {
      await LivingAppsService.createThemenFeedbackEntry({
        thementitel,
        beschreibung: themaBeschreibung || undefined,
        sitzung: createRecordUrl(APP_IDS.SITZUNGEN, sitzungId),
        verantwortlicher:
          verantwortlicherId
            ? createRecordUrl(APP_IDS.MITGLIEDER, verantwortlicherId)
            : undefined,
        themenstatus: 'offen',
      });
      setAddedThemen(prev => [...prev, thementitel]);
      setThementitel('');
      setThemaBeschreibung('');
      setVerantwortlicherId('');
      await fetchAll();
    } catch {
      setErrorStep2(tx('Fehler beim Anlegen des Themas. Bitte erneut versuchen.'));
    } finally {
      setSavingThema(false);
    }
  };

  // Step 3: Assign members
  const toggleMitglied = (id: string) => {
    setSelectedMitglieder(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAssignMitglieder = async () => {
    if (!sitzungId) return;
    setSavingStep3(true);
    setErrorStep3(null);
    try {
      const urls = Array.from(selectedMitglieder).map(id =>
        createRecordUrl(APP_IDS.MITGLIEDER, id)
      );
      await LivingAppsService.updateSitzungenEntry(sitzungId, {
        mitglieder: urls.length > 0 ? urls : undefined,
      });
      setDone(true);
    } catch {
      setErrorStep3(tx('Fehler beim Zuweisen der Mitglieder. Bitte erneut versuchen.'));
    } finally {
      setSavingStep3(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setTitel('');
    setDatum('');
    setOrt('');
    setBeschreibung('');
    setTagesordnung('');
    setSitzungId(null);
    setAddedThemen([]);
    setThementitel('');
    setThemaBeschreibung('');
    setVerantwortlicherId('');
    setSelectedMitglieder(new Set());
    setDone(false);
    setErrorStep1(null);
    setErrorStep2(null);
    setErrorStep3(null);
  };

  return (
    <IntentWizardShell
      title={tx('Sitzung vorbereiten')}
      subtitle={tx('In 3 Schritten zur fertigen Gremiumssitzung')}
      steps={[
        { label: tx('Sitzung anlegen') },
        { label: tx('Themen erfassen') },
        { label: tx('Mitglieder zuweisen') },
      ]}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ── Schritt 1: Sitzung anlegen ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s1-titel" className="text-sm font-medium">
                {tx('Titel')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s1-titel"
                value={titel}
                onChange={e => setTitel(e.target.value)}
                placeholder={tx('z. B. Vorstandssitzung Q3 2026')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s1-datum" className="text-sm font-medium">
                {tx('Datum & Uhrzeit')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IconCalendarEvent
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0"
                />
                <Input
                  id="s1-datum"
                  type="datetime-local"
                  value={datum}
                  onChange={e => setDatum(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s1-ort" className="text-sm font-medium">
                {tx('Ort')}
              </Label>
              <div className="relative">
                <IconMapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0"
                />
                <Input
                  id="s1-ort"
                  value={ort}
                  onChange={e => setOrt(e.target.value)}
                  placeholder={tx('z. B. Konferenzraum 2')}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s1-beschreibung" className="text-sm font-medium">
                {tx('Beschreibung')}
              </Label>
              <Textarea
                id="s1-beschreibung"
                value={beschreibung}
                onChange={e => setBeschreibung(e.target.value)}
                placeholder={tx('Kurze Beschreibung der Sitzung …')}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s1-tagesordnung" className="text-sm font-medium">
                {tx('Tagesordnung')}
              </Label>
              <Textarea
                id="s1-tagesordnung"
                value={tagesordnung}
                onChange={e => setTagesordnung(e.target.value)}
                placeholder={tx('Übersicht der geplanten Punkte …')}
                rows={4}
              />
            </div>
          </div>

          {errorStep1 && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <IconAlertCircle size={16} className="shrink-0" />
              {errorStep1}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!titel.trim() || !datum || savingStep1}
            onClick={handleCreateSitzung}
          >
            {savingStep1 ? tx('Wird angelegt …') : tx('Sitzung anlegen & weiter')}
          </Button>
        </div>
      )}

      {/* ── Schritt 2: Themen erfassen ── */}
      {step === 2 && (
        sitzungId ? (
          <div className="space-y-6">
            {/* bereits hinzugefügte Themen */}
            {addedThemen.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {tx('Bereits erfasste Themen')}
                </p>
                <ul className="space-y-1.5">
                  {addedThemen.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-sm">
                      <IconCheck size={14} className="shrink-0 text-emerald-500" />
                      <span className="min-w-0 truncate">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mini-Form neues Thema */}
            <div className="rounded-2xl border bg-card p-4 space-y-4">
              <p className="text-sm font-semibold">{tx('Neues Thema hinzufügen')}</p>

              <div className="space-y-1.5">
                <Label htmlFor="s2-thementitel" className="text-sm font-medium">
                  {tx('Thementitel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s2-thementitel"
                  value={thementitel}
                  onChange={e => setThementitel(e.target.value)}
                  placeholder={tx('z. B. Budgetplanung 2027')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-beschreibung" className="text-sm font-medium">
                  {tx('Beschreibung')}
                </Label>
                <Textarea
                  id="s2-beschreibung"
                  value={themaBeschreibung}
                  onChange={e => setThemaBeschreibung(e.target.value)}
                  placeholder={tx('Optionale Details zum Thema …')}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-verantwortlicher" className="text-sm font-medium">
                  {tx('Verantwortliche Person')}
                </Label>
                <select
                  id="s2-verantwortlicher"
                  value={verantwortlicherId}
                  onChange={e => setVerantwortlicherId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{tx('Niemanden zuweisen')}</option>
                  {aktiveMitglieder.map(m => (
                    <option key={m.record_id} value={m.record_id}>
                      {[m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {errorStep2 && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <IconAlertCircle size={16} className="shrink-0" />
                  {errorStep2}
                </div>
              )}

              <Button
                className="w-full"
                variant="outline"
                disabled={!thementitel.trim() || savingThema}
                onClick={handleAddThema}
              >
                <IconPlus size={16} className="shrink-0 mr-1.5" />
                {savingThema ? tx('Wird gespeichert …') : tx('Thema hinzufügen')}
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => setStep(3)}
              >
                {addedThemen.length === 0
                  ? tx('Weiter ohne Themen')
                  : tx('Weiter zu Schritt 3')}
              </Button>
              {addedThemen.length > 0 && (
                <Button
                  className="w-full sm:flex-1"
                  onClick={() => setStep(3)}
                >
                  {tx('Fertig — Mitglieder zuweisen')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht die Sitzung aus Schritt 1.')}
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              {tx('Neu starten')}
            </Button>
          </div>
        )
      )}

      {/* ── Schritt 3: Mitglieder zuweisen ── */}
      {step === 3 && (
        sitzungId ? (
          done ? (
            <div className="text-center py-12 space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <IconCheck size={32} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{tx('Sitzung erfolgreich vorbereitet!')}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMitglieder.size > 0
                    ? `${selectedMitglieder.size} ${tx('Mitglieder wurden zugewiesen.')}`
                    : tx('Die Sitzung wurde ohne Mitgliederzuweisung gespeichert.')}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button onClick={handleReset} variant="outline">
                  {tx('Neue Sitzung vorbereiten')}
                </Button>
                <a
                  href="#/"
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {tx('Zurück zum Dashboard')}
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {tx('Aktive Mitglieder')}
                  </p>
                  {selectedMitglieder.size > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {selectedMitglieder.size} {tx('ausgewählt')}
                    </span>
                  )}
                </div>

                {aktiveMitglieder.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
                    <IconUsers size={32} className="text-muted-foreground" stroke={1.5} />
                    <p className="text-sm text-muted-foreground">
                      {tx('Keine aktiven Mitglieder gefunden.')}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y rounded-xl border overflow-hidden">
                    {aktiveMitglieder.map(m => {
                      const isSelected = selectedMitglieder.has(m.record_id);
                      const fullName = [m.fields.vorname, m.fields.nachname]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <li key={m.record_id}>
                          <button
                            type="button"
                            onClick={() => toggleMitglied(m.record_id)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-input bg-background'
                              }`}
                            >
                              {isSelected && (
                                <IconCheck size={12} className="text-primary-foreground" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{fullName || tx('Unbekannt')}</span>
                              {(m.fields.funktion || m.fields.abteilung) && (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {[m.fields.funktion, m.fields.abteilung].filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <IconTrash
                                size={14}
                                className="shrink-0 text-muted-foreground"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleMitglied(m.record_id);
                                }}
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {errorStep3 && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <IconAlertCircle size={16} className="shrink-0" />
                  {errorStep3}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  disabled={savingStep3}
                  onClick={handleAssignMitglieder}
                >
                  {tx('Ohne Mitglieder abschließen')}
                </Button>
                <Button
                  className="w-full sm:flex-1"
                  disabled={selectedMitglieder.size === 0 || savingStep3}
                  onClick={handleAssignMitglieder}
                >
                  {savingStep3
                    ? tx('Wird gespeichert …')
                    : `${tx('Sitzung abschließen')}${selectedMitglieder.size > 0 ? ` (${selectedMitglieder.size})` : ''}`}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht die Sitzung aus Schritt 1.')}
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

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { IconCalendar, IconMapPin, IconCheck, IconX, IconQuestionMark } from '@tabler/icons-react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  listPublicRecords,
  createPublicRecord,
  prepareChallenge,
  recordRef,
  PageUnavailableError,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { tx, dateFnsLocale } from '@/i18n';

const SITZUNGEN_APP_ID = '6a8308470e2a00ba472be888';
const ANMELDUNGEN_APP_ID = '6a830848df6bc1d8327d7346';

type Sitzung = {
  record_id: string;
  fields: {
    titel?: string;
    datum?: string;
    ort?: string;
    beschreibung?: string;
  };
};

type FormState = {
  vorname: string;
  nachname: string;
  email: string;
  organisation: string;
  teilnahme: 'zugesagt' | 'abgesagt' | 'vielleicht' | '';
  anmerkungen: string;
};

function formatSitzungDatum(datum: string | undefined): string {
  if (!datum) return '';
  try {
    return format(parseISO(datum), "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: dateFnsLocale() });
  } catch {
    return datum;
  }
}

export default function Sitzungsanmeldung() {
  const TEILNAHME_OPTIONS: { key: 'zugesagt' | 'abgesagt' | 'vielleicht'; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'zugesagt',
    label: tx('Ja, ich nehme teil'),
    icon: <IconCheck size={20} />,
    color: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  {
    key: 'abgesagt',
    label: tx('Nein, ich kann nicht'),
    icon: <IconX size={20} />,
    color: 'border-red-400 bg-red-50 text-red-700',
  },
  {
    key: 'vielleicht',
    label: tx('Vielleicht'),
    icon: <IconQuestionMark size={20} />,
    color: 'border-amber-400 bg-amber-50 text-amber-700',
  },
];

  const [searchParams] = useSearchParams();
  const sitzungId = searchParams.get('sitzungId') ?? '';

  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const [sitzung, setSitzung] = useState<Sitzung | null>(null);
  const [sitzungLoading, setSitzungLoading] = useState(false);
  const [sitzungNotFound, setSitzungNotFound] = useState(false);

  const [form, setForm] = useState<FormState>({
    vorname: '',
    nachname: '',
    email: '',
    organisation: '',
    teilnahme: 'zugesagt',
    anmerkungen: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [challengePrepared, setChallengePrep] = useState(false);

  useEffect(() => {
    loadPublicPagesConfig()
      .then(c => {
        setCfg(c);
        setPage(c?.pages['sitzungsanmeldung'] ?? null);
        setLoading(false);
      })
      .catch(err => {
        if (err instanceof PageUnavailableError) {
          setUnavailable(true);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!cfg || !page || !sitzungId) return;
    setSitzungLoading(true);
    listPublicRecords(cfg, page, { appId: SITZUNGEN_APP_ID })
      .then(records => {
        const entry = sitzungId ? records[sitzungId] : undefined;
        const found: Sitzung | undefined = entry
          ? { record_id: entry.id, fields: entry.fields as Sitzung['fields'] }
          : undefined;
        if (found) {
          setSitzung(found);
        } else {
          setSitzungNotFound(true);
        }
      })
      .catch(() => setSitzungNotFound(true))
      .finally(() => setSitzungLoading(false));
  }, [cfg, page, sitzungId]);

  const prepareOnce = () => {
    if (challengePrepared || !cfg || !page) return;
    setChallengePrep(true);
    prepareChallenge(cfg, page, 'POST', `/apps/${ANMELDUNGEN_APP_ID}/records`);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.vorname.trim()) next.vorname = tx('Pflichtfeld');
    if (!form.nachname.trim()) next.nachname = tx('Pflichtfeld');
    if (!form.email.trim()) {
      next.email = tx('Pflichtfeld');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = tx('Bitte eine gültige E-Mail-Adresse eingeben');
    }
    if (!form.teilnahme) next.teilnahme = tx('Bitte eine Option wählen');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !cfg || !page || !sitzung) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const sitzungRef = recordRef(cfg, page, SITZUNGEN_APP_ID, sitzung.record_id);
      const payload: Record<string, string> = {
        sitzung: sitzungRef,
        vorname: form.vorname.trim(),
        nachname: form.nachname.trim(),
        email: form.email.trim(),
        teilnahme: form.teilnahme,
      };
      if (form.organisation.trim()) payload.organisation = form.organisation.trim();
      if (form.anmerkungen.trim()) payload.anmerkungen = form.anmerkungen.trim();
      await createPublicRecord(cfg, page, payload);
      setSubmitted(true);
    } catch {
      setSubmitError(tx('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PublicShell loading />;
  if (unavailable || !page) return <PublicShell unavailable />;

  if (!sitzungId) {
    return (
      <PublicShell title={tx('Sitzungsanmeldung')} description={tx('Kein Sitzungslink angegeben.')}>
        <div className="text-center py-12 text-muted-foreground">
          <IconCalendar size={48} className="mx-auto mb-4 opacity-40" />
          <p>{tx('Dieser Link ist unvollständig. Bitte verwende den Link aus der Einladungs-E-Mail.')}</p>
        </div>
      </PublicShell>
    );
  }

  if (sitzungLoading) return <PublicShell loading />;

  if (sitzungNotFound) {
    return (
      <PublicShell title={tx('Sitzungsanmeldung')} description={tx('Sitzung nicht gefunden.')}>
        <div className="text-center py-12 text-muted-foreground">
          <IconCalendar size={48} className="mx-auto mb-4 opacity-40" />
          <p>{tx('Die Sitzung wurde nicht gefunden oder ist nicht mehr verfügbar.')}</p>
        </div>
      </PublicShell>
    );
  }

  const sitzungTitel = sitzung?.fields.titel ?? tx('Sitzung');
  const sitzungDatum = formatSitzungDatum(sitzung?.fields.datum);
  const sitzungOrt = sitzung?.fields.ort;

  if (submitted) {
    const teilnahmeLabel = TEILNAHME_OPTIONS.find(o => o.key === form.teilnahme);
    return (
      <PublicShell title={tx('Anmeldung bestätigt')} description={sitzungTitel}>
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <IconCheck size={36} />
          </div>
          <h2 className="text-xl font-semibold mb-2">{tx('Vielen Dank für deine Rückmeldung!')}</h2>
          <p className="text-muted-foreground mb-6">
            {tx('Deine Anmeldung wurde erfolgreich übermittelt.')}
          </p>
          <div className="inline-block bg-muted rounded-xl px-6 py-4 text-left space-y-2 text-sm">
            <div className="font-medium text-base mb-1">{sitzungTitel}</div>
            {sitzungDatum && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconCalendar size={15} className="shrink-0" />
                <span>{sitzungDatum}</span>
              </div>
            )}
            {sitzungOrt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconMapPin size={15} className="shrink-0" />
                <span>{sitzungOrt}</span>
              </div>
            )}
            {teilnahmeLabel && (
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${teilnahmeLabel.color}`}>
                {teilnahmeLabel.icon}
                {teilnahmeLabel.label}
              </div>
            )}
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title={tx('Zur Sitzung anmelden')}
      description={sitzungTitel}
    >
      {/* Sitzungskontext */}
      <div className="bg-muted rounded-xl px-4 py-4 mb-6 space-y-1.5 text-sm">
        <div className="font-semibold text-base">{sitzungTitel}</div>
        {sitzungDatum && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconCalendar size={15} className="shrink-0" />
            <span>{sitzungDatum}</span>
          </div>
        )}
        {sitzungOrt && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconMapPin size={15} className="shrink-0" />
            <span>{sitzungOrt}</span>
          </div>
        )}
      </div>

      {/* Formular */}
      <form onSubmit={handleSubmit} onFocus={prepareOnce} noValidate className="space-y-5">
        {/* Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="vorname">
              {tx('Vorname')} <span className="text-red-500">*</span>
            </label>
            <input
              id="vorname"
              type="text"
              autoComplete="given-name"
              value={form.vorname}
              onChange={e => setForm(f => ({ ...f, vorname: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${errors.vorname ? 'border-red-400' : 'border-input'}`}
              placeholder={tx('Dein Vorname')}
            />
            {errors.vorname && <p className="mt-1 text-xs text-red-500">{errors.vorname}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="nachname">
              {tx('Nachname')} <span className="text-red-500">*</span>
            </label>
            <input
              id="nachname"
              type="text"
              autoComplete="family-name"
              value={form.nachname}
              onChange={e => setForm(f => ({ ...f, nachname: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${errors.nachname ? 'border-red-400' : 'border-input'}`}
              placeholder={tx('Dein Nachname')}
            />
            {errors.nachname && <p className="mt-1 text-xs text-red-500">{errors.nachname}</p>}
          </div>
        </div>

        {/* E-Mail */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">
            {tx('E-Mail-Adresse')} <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${errors.email ? 'border-red-400' : 'border-input'}`}
            placeholder={tx('deine@email.de')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Organisation */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="organisation">
            {tx('Organisation / Unternehmen')}
            <span className="text-muted-foreground font-normal ml-1">({tx('optional')})</span>
          </label>
          <input
            id="organisation"
            type="text"
            autoComplete="organization"
            value={form.organisation}
            onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder={tx('Deine Organisation')}
          />
        </div>

        {/* Teilnahme */}
        <div>
          <p className="text-sm font-medium mb-2.5">
            {tx('Wirst du teilnehmen?')} <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TEILNAHME_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm(f => ({ ...f, teilnahme: opt.key }))}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.teilnahme === opt.key
                    ? opt.color + ' border-current'
                    : 'border-input bg-background text-foreground hover:bg-muted'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
          {errors.teilnahme && <p className="mt-1.5 text-xs text-red-500">{errors.teilnahme}</p>}
        </div>

        {/* Anmerkungen */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="anmerkungen">
            {tx('Anmerkungen')}
            <span className="text-muted-foreground font-normal ml-1">({tx('optional')})</span>
          </label>
          <textarea
            id="anmerkungen"
            rows={3}
            value={form.anmerkungen}
            onChange={e => setForm(f => ({ ...f, anmerkungen: e.target.value }))}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder={tx('Hast du noch Fragen oder besondere Hinweise?')}
          />
        </div>

        {submitError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? tx('Wird gesendet …') : tx('Anmeldung absenden')}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          {tx('Mit dem Absenden stimmst du zu, dass deine Angaben für die Verwaltung dieser Sitzung gespeichert werden.')}
        </p>
      </form>
    </PublicShell>
  );
}

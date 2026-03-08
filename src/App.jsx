import { useState, useMemo, useEffect } from "react";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://dkmdgrfvzdgnzylhqcko.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWRncmZ2emRnbnp5bGhxY2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njg3ODIsImV4cCI6MjA4ODU0NDc4Mn0.YktstZkUdegC9Xtj4VHylZFjHavoGQXVSrgsmU43Od0";

const db = {
  async getAll() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/people?select=*&order=birthday`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    if (!res.ok) throw new Error("Kunne ikke hente data");
    return res.json();
  },
  async insert(person) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/people`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(person)
    });
    if (!res.ok) throw new Error("Kunne ikke lagre person");
    return res.json();
  },
  async delete(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/people?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    if (!res.ok) throw new Error("Kunne ikke slette person");
  }
};

// ── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#F4F5F7", surface: "#FFFFFF", border: "#E4E7EB", borderStrong: "#CBD2D9",
  text: "#1F2933", textSub: "#52606D", textMuted: "#9AA5B4",
  accent: "#1D4ED8", accentHover: "#1E40AF", accentLight: "#EFF6FF", accentMid: "#BFDBFE",
  todayBg: "#FFFBEB", todayBorder: "#F59E0B", todayText: "#92400E",
  errorText: "#DC2626", errorBg: "#FEF2F2",
  successText: "#065F46", successBg: "#ECFDF5",
  deleteBg: "#FEF2F2", deleteText: "#DC2626",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Outfit:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }

  .bt-root { font-family: 'Outfit', sans-serif; background: ${C.bg}; min-height: 100vh; color: ${C.text}; padding: 40px 20px 80px; }
  .bt-wrap { max-width: 700px; margin: 0 auto; }

  .bt-header { margin-bottom: 32px; }
  .bt-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
  .bt-brand-icon { width: 44px; height: 44px; background: ${C.accent}; border-radius: 11px; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; }
  .bt-brand-name { font-family: 'Libre Baskerville', serif; font-size: clamp(20px, 4vw, 26px); font-weight: 700; color: ${C.text}; letter-spacing: -0.2px; }
  .bt-brand-sub { font-size: 13.5px; color: ${C.textMuted}; margin-top: 3px; padding-left: 58px; }

  .bt-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .bt-stat { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 12px; padding: 18px 20px; }
  .bt-stat-val { font-family: 'Libre Baskerville', serif; font-size: 28px; font-weight: 700; color: ${C.text}; line-height: 1; }
  .bt-stat-val.accent { color: ${C.accent}; }
  .bt-stat-val.warn { color: ${C.todayText}; }
  .bt-stat-key { font-size: 11px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 500; margin-top: 6px; }

  .bt-alert { background: ${C.todayBg}; border: 1px solid ${C.todayBorder}; border-radius: 11px; padding: 15px 18px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 13px; }
  .bt-alert-icon { font-size: 22px; flex-shrink: 0; line-height: 1.2; }
  .bt-alert-body strong { font-size: 14px; font-weight: 600; color: ${C.todayText}; display: block; }
  .bt-alert-body span { font-size: 12.5px; color: #B45309; margin-top: 2px; display: block; }

  .bt-db-badge { display: inline-flex; align-items: center; gap: 7px; background: ${C.successBg}; border: 1px solid #6EE7B7; border-radius: 9px; padding: 9px 14px; margin-bottom: 20px; font-size: 12.5px; color: ${C.successText}; font-weight: 500; }
  .bt-db-dot { width: 7px; height: 7px; border-radius: 50%; background: #10B981; animation: pulse 2s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

  .bt-err-banner { background: ${C.errorBg}; border: 1px solid #FECACA; border-radius: 9px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: ${C.errorText}; }

  .bt-toolbar { display: flex; gap: 10px; margin-bottom: 14px; align-items: center; }
  .bt-search-wrap { flex: 1; position: relative; }
  .bt-search-ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: ${C.textMuted}; font-size: 15px; pointer-events: none; }
  .bt-search { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid ${C.border}; border-radius: 9px; font-size: 14px; background: ${C.surface}; color: ${C.text}; font-family: 'Outfit', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; }
  .bt-search:focus { border-color: ${C.accent}; box-shadow: 0 0 0 3px ${C.accentLight}; }
  .bt-search::placeholder { color: ${C.textMuted}; }

  .bt-btn-primary { padding: 10px 20px; background: ${C.accent}; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 7px; white-space: nowrap; transition: background .15s, box-shadow .15s; }
  .bt-btn-primary:hover { background: ${C.accentHover}; box-shadow: 0 4px 14px rgba(29,78,216,0.28); }
  .bt-btn-primary:focus-visible { outline: 3px solid ${C.accentMid}; outline-offset: 2px; }
  .bt-btn-primary:disabled { opacity: .6; cursor: not-allowed; }

  .bt-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 14px; overflow: hidden; }
  .bt-thead { display: grid; grid-template-columns: 1fr 100px 110px 96px 36px; padding: 9px 20px; background: ${C.bg}; border-bottom: 1px solid ${C.border}; }
  .bt-thead span { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.65px; color: ${C.textMuted}; }
  .bt-row { display: grid; grid-template-columns: 1fr 100px 110px 96px 36px; padding: 13px 20px; border-bottom: 1px solid ${C.border}; align-items: center; transition: background .1s; }
  .bt-row:last-child { border-bottom: none; }
  .bt-row:hover { background: #FAFBFC; }
  .bt-row.today { background: ${C.todayBg}; }
  .bt-row.today:hover { background: #FEF3C7; }
  .bt-row.soon { background: ${C.accentLight}; }
  .bt-row.soon:hover { background: #E0EFFE; }

  .bt-person { display: flex; align-items: center; gap: 11px; min-width: 0; }
  .bt-avatar { width: 34px; height: 34px; border-radius: 50%; background: ${C.accentLight}; border: 1px solid ${C.accentMid}; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: ${C.accent}; flex-shrink: 0; }
  .bt-avatar.today { background: ${C.todayBg}; border-color: ${C.todayBorder}; color: ${C.todayText}; }
  .bt-person-name { font-size: 14px; font-weight: 600; color: ${C.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bt-person-email { font-size: 11.5px; color: ${C.textMuted}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bt-cell { font-size: 13px; color: ${C.textSub}; }
  .bt-cell small { font-size: 11px; color: ${C.textMuted}; display: block; margin-top: 1px; }

  .bt-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .bt-badge.today { background: ${C.todayBg}; color: ${C.todayText}; border: 1px solid ${C.todayBorder}; }
  .bt-badge.soon { background: ${C.accentLight}; color: ${C.accent}; border: 1px solid ${C.accentMid}; }
  .bt-badge.normal { color: ${C.textMuted}; font-weight: 500; }

  .bt-del-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid ${C.border}; background: transparent; color: ${C.textMuted}; cursor: pointer; font-size: 14px; display: grid; place-items: center; transition: background .15s, color .15s, border-color .15s; }
  .bt-del-btn:hover { background: ${C.deleteBg}; color: ${C.deleteText}; border-color: #FECACA; }
  .bt-del-btn:focus-visible { outline: 3px solid ${C.accentMid}; outline-offset: 2px; }

  .bt-loading { padding: 48px 24px; text-align: center; color: ${C.textMuted}; font-size: 14px; }
  .bt-spinner { width: 28px; height: 28px; border: 3px solid ${C.border}; border-top-color: ${C.accent}; border-radius: 50%; animation: spin .7s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .bt-empty { padding: 56px 24px; text-align: center; }
  .bt-empty-icon { font-size: 36px; margin-bottom: 12px; }
  .bt-empty-title { font-size: 15px; font-weight: 600; color: ${C.textSub}; margin-bottom: 4px; }
  .bt-empty-sub { font-size: 13px; color: ${C.textMuted}; }

  .bt-meta { font-size: 12.5px; color: ${C.textMuted}; padding: 10px 4px 0; }

  .bt-overlay { position: fixed; inset: 0; background: rgba(17,24,39,.4); display: grid; place-items: center; padding: 20px; z-index: 200; backdrop-filter: blur(3px); }
  .bt-modal { background: ${C.surface}; border-radius: 16px; padding: 32px; width: 100%; max-width: 440px; box-shadow: 0 24px 60px rgba(0,0,0,.13); }
  .bt-modal-title { font-family: 'Libre Baskerville', serif; font-size: 19px; font-weight: 700; color: ${C.text}; margin-bottom: 4px; }
  .bt-modal-sub { font-size: 13px; color: ${C.textSub}; margin-bottom: 24px; line-height: 1.5; }
  .bt-field { margin-bottom: 15px; }
  .bt-label { display: block; font-size: 12px; font-weight: 600; color: ${C.textSub}; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .bt-input { width: 100%; padding: 10px 14px; border: 1px solid ${C.border}; border-radius: 9px; font-size: 14px; color: ${C.text}; font-family: 'Outfit', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; background: ${C.surface}; }
  .bt-input:focus { border-color: ${C.accent}; box-shadow: 0 0 0 3px ${C.accentLight}; }
  .bt-input::placeholder { color: ${C.textMuted}; }
  .bt-input.error { border-color: ${C.errorText}; box-shadow: 0 0 0 3px ${C.errorBg}; }
  .bt-error { font-size: 12px; color: ${C.errorText}; margin-top: 5px; display: block; }
  .bt-required { color: ${C.errorText}; }

  .bt-modal-actions { display: flex; gap: 10px; margin-top: 24px; }
  .bt-btn-ghost { flex: 1; padding: 11px; border: 1px solid ${C.border}; background: transparent; border-radius: 9px; font-size: 14px; font-weight: 500; color: ${C.textSub}; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s; }
  .bt-btn-ghost:hover { background: ${C.bg}; }
  .bt-btn-ghost:focus-visible { outline: 3px solid ${C.accentMid}; outline-offset: 2px; }
  .bt-btn-submit { flex: 2; padding: 11px; background: ${C.accent}; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Outfit', sans-serif; transition: background .15s; }
  .bt-btn-submit:hover { background: ${C.accentHover}; }
  .bt-btn-submit:disabled { opacity: .6; cursor: not-allowed; }
  .bt-btn-submit:focus-visible { outline: 3px solid ${C.accentMid}; outline-offset: 2px; }

  .bt-success { text-align: center; padding: 16px 0 8px; }
  .bt-success-check { width: 52px; height: 52px; background: ${C.successBg}; border-radius: 50%; display: grid; place-items: center; font-size: 24px; margin: 0 auto 14px; }
  .bt-success-title { font-size: 16px; font-weight: 600; color: ${C.successText}; }
  .bt-success-sub { font-size: 13px; color: ${C.textSub}; margin-top: 4px; }

  @media (max-width: 500px) {
    .bt-thead { grid-template-columns: 1fr 86px 36px; }
    .bt-thead span:nth-child(2), .bt-thead span:nth-child(3) { display: none; }
    .bt-row { grid-template-columns: 1fr 86px 36px; }
    .bt-row > .bt-cell:nth-child(2), .bt-row > .bt-cell:nth-child(3) { display: none; }
    .bt-stats { grid-template-columns: 1fr 1fr; }
    .bt-stats .bt-stat:last-child { grid-column: span 2; }
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDaysUntil(bStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const b = new Date(bStr);
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  const d = Math.round((next - today) / 86400000);
  return d === 365 ? 0 : d;
}
function getAge(bStr) {
  const t = new Date(), b = new Date(bStr);
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}
function fmtDate(bStr) {
  return new Date(bStr).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}
function initials(name) {
  return name.trim().split(/\s+/).slice(0,2).map(n => n[0]).join("").toUpperCase();
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function BirthdayTracker() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", birthday: "", email: "", department: "" });
  const [errors, setErrors] = useState({});

  // Load from Supabase on mount
  useEffect(() => {
    db.getAll()
      .then(data => { setPeople(data); setLoading(false); })
      .catch(err => { setGlobalError(err.message); setLoading(false); });
  }, []);

  const sorted = useMemo(() =>
    [...people]
      .filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.department || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => getDaysUntil(a.birthday) - getDaysUntil(b.birthday)),
    [people, search]
  );

  const todayPeople = people.filter(p => getDaysUntil(p.birthday) === 0);
  const nextUp = sorted.find(p => getDaysUntil(p.birthday) > 0);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Navn er påkrevd";
    if (!form.birthday) e.birthday = "Fødselsdato er påkrevd";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Gyldig e-postadresse er påkrevd";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const [inserted] = await db.insert({
        name: form.name.trim(),
        email: form.email.trim(),
        birthday: form.birthday,
        department: form.department.trim() || null,
      });
      setPeople(p => [...p, inserted]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowModal(false);
        setForm({ name: "", birthday: "", email: "", department: "" });
        setErrors({});
      }, 2400);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Fjern ${name} fra listen?`)) return;
    try {
      await db.delete(id);
      setPeople(p => p.filter(x => x.id !== id));
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setForm({ name: "", birthday: "", email: "", department: "" });
    setErrors({});
  };

  return (
    <>
      <style>{css}</style>
      <div className="bt-root" role="main">
        <div className="bt-wrap">

          <header className="bt-header">
            <div className="bt-brand">
              <div className="bt-brand-icon" aria-hidden="true">📋</div>
              <h1 className="bt-brand-name">Bursdagsoversikt</h1>
            </div>
            <p className="bt-brand-sub">Administrer og følg opp fødselsdager i organisasjonen</p>
          </header>

          <section className="bt-stats" aria-label="Nøkkeltall">
            <div className="bt-stat">
              <div className="bt-stat-val">{people.length}</div>
              <div className="bt-stat-key">Registrerte</div>
            </div>
            <div className="bt-stat">
              <div className={`bt-stat-val${todayPeople.length > 0 ? " warn" : ""}`}>{todayPeople.length}</div>
              <div className="bt-stat-key">Bursdager i dag</div>
            </div>
            <div className="bt-stat">
              <div className="bt-stat-val accent">{nextUp ? getDaysUntil(nextUp.birthday) : "–"}</div>
              <div className="bt-stat-key">Dager til neste</div>
            </div>
          </section>

          {/* Supabase connection indicator */}
          {!loading && !globalError && (
            <div className="bt-db-badge" role="status">
              <span className="bt-db-dot" aria-hidden="true" />
              Koblet til Supabase — data lagres i sky
            </div>
          )}

          {globalError && (
            <div className="bt-err-banner" role="alert">
              ⚠️ {globalError} — sjekk at tabellen «people» finnes i Supabase
            </div>
          )}

          {todayPeople.length > 0 && (
            <div className="bt-alert" role="alert" aria-live="polite">
              <span className="bt-alert-icon" aria-hidden="true">🎂</span>
              <div className="bt-alert-body">
                <strong>{todayPeople.map(p => p.name).join(" og ")} har bursdag i dag</strong>
                <span>Husk å sende en hilsen!</span>
              </div>
            </div>
          )}

          <div className="bt-toolbar">
            <div className="bt-search-wrap">
              <span className="bt-search-ico" aria-hidden="true">⌕</span>
              <input
                className="bt-search"
                type="search"
                placeholder="Søk på navn eller avdeling…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Søk etter person eller avdeling"
              />
            </div>
            <button
              className="bt-btn-primary"
              onClick={() => setShowModal(true)}
              disabled={loading}
              aria-label="Legg til ny person"
            >
              <span aria-hidden="true">+</span> Legg til
            </button>
          </div>

          <div className="bt-card" role="region" aria-label="Bursdagsliste">
            <div className="bt-thead" aria-hidden="true">
              <span>Navn</span>
              <span>Dato</span>
              <span>Avdeling</span>
              <span>Nedtelling</span>
              <span></span>
            </div>

            {loading ? (
              <div className="bt-loading" role="status" aria-label="Laster inn...">
                <div className="bt-spinner" aria-hidden="true" />
                Henter data fra Supabase…
              </div>
            ) : sorted.length === 0 && search ? (
              <div className="bt-empty" role="status">
                <div className="bt-empty-icon">🔍</div>
                <div className="bt-empty-title">Ingen treff for «{search}»</div>
                <div className="bt-empty-sub">Prøv et annet søkeord</div>
              </div>
            ) : sorted.length === 0 ? (
              <div className="bt-empty" role="status">
                <div className="bt-empty-icon">👥</div>
                <div className="bt-empty-title">Ingen personer registrert ennå</div>
                <div className="bt-empty-sub">Klikk «Legg til» for å registrere den første personen</div>
              </div>
            ) : (
              <ul style={{ listStyle: "none" }}>
                {sorted.map(person => {
                  const days = getDaysUntil(person.birthday);
                  const isToday = days === 0;
                  const isSoon = !isToday && days <= 7;
                  return (
                    <li
                      key={person.id}
                      className={`bt-row${isToday ? " today" : isSoon ? " soon" : ""}`}
                      aria-label={`${person.name}${isToday ? ", bursdag i dag" : `, bursdag om ${days} dager`}`}
                    >
                      <div className="bt-person">
                        <div className={`bt-avatar${isToday ? " today" : ""}`} aria-hidden="true">
                          {initials(person.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="bt-person-name">{person.name}</div>
                          <div className="bt-person-email">{person.email}</div>
                        </div>
                      </div>
                      <div className="bt-cell">
                        {fmtDate(person.birthday)}
                        <small>{getAge(person.birthday)} år</small>
                      </div>
                      <div className="bt-cell">{person.department || "–"}</div>
                      <div className="bt-cell">
                        {isToday
                          ? <span className="bt-badge today">I dag 🎂</span>
                          : isSoon
                          ? <span className="bt-badge soon">Om {days} d</span>
                          : <span className="bt-badge normal">{days} dager</span>
                        }
                      </div>
                      <div>
                        <button
                          className="bt-del-btn"
                          onClick={() => handleDelete(person.id, person.name)}
                          aria-label={`Fjern ${person.name}`}
                          title="Fjern person"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {people.length > 0 && (
            <p className="bt-meta" aria-live="polite">
              Viser {sorted.length} av {people.length} registrerte personer
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="bt-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-heading"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bt-modal">
            {submitted ? (
              <div className="bt-success" role="status" aria-live="assertive">
                <div className="bt-success-check" aria-hidden="true">✓</div>
                <div className="bt-success-title">Person lagret</div>
                <div className="bt-success-sub">{form.name} er registrert i Supabase</div>
              </div>
            ) : (
              <>
                <h2 className="bt-modal-title" id="modal-heading">Registrer person</h2>
                <p className="bt-modal-sub">Fyll inn informasjonen nedenfor. Felter merket med * er obligatoriske.</p>

                {errors.submit && (
                  <div className="bt-err-banner" role="alert" style={{ marginBottom: 16 }}>
                    ⚠️ {errors.submit}
                  </div>
                )}

                {[
                  { key: "name", label: "Fullt navn", type: "text", placeholder: "Ola Nordmann", req: true },
                  { key: "email", label: "E-postadresse", type: "email", placeholder: "ola@bedrift.no", req: true },
                  { key: "birthday", label: "Fødselsdato", type: "date", placeholder: "", req: true },
                  { key: "department", label: "Avdeling", type: "text", placeholder: "f.eks. Teknologi", req: false },
                ].map(f => (
                  <div className="bt-field" key={f.key}>
                    <label className="bt-label" htmlFor={`f-${f.key}`}>
                      {f.label}{f.req && <span className="bt-required" aria-hidden="true"> *</span>}
                    </label>
                    <input
                      id={`f-${f.key}`}
                      className={`bt-input${errors[f.key] ? " error" : ""}`}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => {
                        setForm(p => ({ ...p, [f.key]: e.target.value }));
                        if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: undefined }));
                      }}
                      aria-required={f.req}
                      aria-describedby={errors[f.key] ? `e-${f.key}` : undefined}
                      aria-invalid={!!errors[f.key]}
                    />
                    {errors[f.key] && (
                      <span id={`e-${f.key}`} className="bt-error" role="alert">{errors[f.key]}</span>
                    )}
                  </div>
                ))}

                <div className="bt-modal-actions">
                  <button className="bt-btn-ghost" onClick={closeModal}>Avbryt</button>
                  <button
                    className="bt-btn-submit"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? "Lagrer…" : "Lagre person"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

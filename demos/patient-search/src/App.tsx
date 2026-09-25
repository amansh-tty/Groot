import { useEffect, useState } from 'react';
import { Avatar, Button, Card, ClinicShell, Field, Input, Tag } from '@playground/design-system';
import type { PrototypeProps } from '../../../packages/shared/src/index';
import patients from '../../../data/patients.json';
export default function PatientSearch({ state }: PrototypeProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<(typeof patients)[number] | null>(null);
  const [retry, setRetry] = useState(false);
  useEffect(() => {
    setQuery(state === 'results' ? 'Avery' : state === 'no-results' ? 'Zelda' : '');
    setSelected(null);
    setRetry(false);
  }, [state]);
  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const filtered = patients.filter((p) =>
    (p.name + ' ' + p.id + ' ' + p.phone).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <ClinicShell>
      <div className="nv-eyebrow">Patients / Directory</div>
      <div className="nv-page-title">
        <div>
          <h1>Find your patient</h1>
          <p>A familiar face. The right record. Ready for the next step.</p>
        </div>
        <Tag>4 fictional patients</Tag>
      </div>
      <Card>
        <Field label="Search patients">
          <Input
            placeholder="Search by name, ID or phone"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
          />
        </Field>
        {state === 'error' && !retry ? (
          <div role="alert" className="nv-empty">
            <h2>Patient search is unavailable</h2>
            <p>We couldn’t load the directory. Try again.</p>
            <Button onClick={() => setRetry(true)}>Retry search</Button>
          </div>
        ) : state === 'searching' || loading ? (
          <div className="nv-empty" role="status">
            <div className="nv-loading" />
            Searching patient records…
          </div>
        ) : selected ? (
          <div>
            <div className="nv-row">
              <Avatar name={selected.name} />
              <h2>{selected.name}</h2>
            </div>
            <p>
              {selected.id} · {selected.age} years
              <br />
              {selected.phone}
            </p>
            <p>Last visit: {selected.lastVisit}</p>
            {selected.alerts.map((a) => (
              <div className="nv-notice" key={a}>
                {a}
              </div>
            ))}
            <Tag tone="success">Patient selected</Tag>
            <div className="nv-actionbar">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Back to results
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="nv-label">
              <span>{query ? 'Search results' : 'Recent patients'}</span>
              <span>{filtered.length} records</span>
            </div>
            {filtered.length ? (
              filtered.map((p) => (
                <button className="nv-patient" key={p.id} onClick={() => setSelected(p)}>
                  <Avatar name={p.name} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.id} · {p.age} years · Last visit {p.lastVisit}
                    </small>
                  </span>
                  <span>→</span>
                </button>
              ))
            ) : (
              <div className="nv-empty">
                <h2>No patients found</h2>
                <p>Try another name, patient ID or phone number.</p>
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
      <p className="nv-readonly-note">
        All patient records are fictional. Selection is held only in this preview.
      </p>
    </ClinicShell>
  );
}

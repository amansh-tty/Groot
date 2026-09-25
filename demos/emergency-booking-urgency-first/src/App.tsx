import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  ClinicShell,
  Field,
  Input,
  Select,
  Tag,
  Textarea,
} from '@playground/design-system';
import type { PrototypeProps } from '../../../packages/shared/src/index';
import patients from '../../../data/patients.json';
import providers from '../../../data/providers.json';
import { availableSlots, types, type Slot } from '../../../data/scheduling';

const simplified = true;
const steps = ['Patient', 'Urgency + appointment', 'Recommended same-day slots', 'Confirmation'];
const screens = ['patient', 'urgency', 'slots', 'confirmation'];
export default function Booking({ screen, state }: PrototypeProps) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [patient, setPatient] = useState<(typeof patients)[number] | null>(null);
  const [urgency, setUrgency] = useState('urgent');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('assessment');
  const [provider, setProvider] = useState('p1');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(false);
    setConfirmed(state === 'confirmation');
    setStep(Math.max(0, screens.indexOf(screen)));
    if ((screen && screen !== 'patient') || state === 'confirmation') {
      setPatient(patients[0]!);
      setReason('Patient requests an urgent appointment');
      setSlot(availableSlots('assessment')[0]!);
    } else {
      setPatient(null);
      setSlot(null);
      setReason('');
    }
    setType('assessment');
    setUrgency(state === 'urgent' ? 'emergency' : 'urgent');
    setProvider('p1');
    setQuery('');
  }, [screen, state]);
  const active = screens[step];
  const appointmentType = types.find((t) => t.id === type)!;
  // Recommend the first compatible provider/room at each time; no clinical triage.
  const allSlots = availableSlots(type);
  const slots = allSlots.filter(
    (s, index) => allSlots.findIndex((other) => other.time === s.time) === index,
  );
  const filtered = patients.filter((p) =>
    (p.name + ' ' + p.id + ' ' + p.phone).toLowerCase().includes(query.toLowerCase()),
  );
  const canContinue =
    active === 'patient'
      ? Boolean(patient)
      : active === 'urgency'
        ? reason.trim().length > 0
        : active === 'slots' || active === 'operatory'
          ? Boolean(slot)
          : true;
  const reset = () => {
    setStep(0);
    setPatient(null);
    setReason('');
    setSlot(null);
    setConfirmed(false);
    setQuery('');
    setDismissed(true);
  };
  const patientPicker = (
    <>
      <Field label="Find a patient">
        <Input
          placeholder="Search by name, ID or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Field>
      <div className="nv-label">
        <span>{query ? 'Search results' : 'Recent patients'}</span>
        <span>{filtered.length} patients</span>
      </div>
      {filtered.map((p) => (
        <button
          key={p.id}
          className="nv-patient"
          aria-pressed={patient?.id === p.id}
          onClick={() => setPatient(p)}
        >
          <Avatar name={p.name} />
          <span>
            <strong>{p.name}</strong>
            <small>
              {p.id} · {p.age} years · {p.phone}
            </small>
          </span>
          <span>{patient?.id === p.id ? '✓' : '→'}</span>
        </button>
      ))}
      {!filtered.length && (
        <div className="nv-empty">No patients match “{query}”. Try a name or patient ID.</div>
      )}
    </>
  );
  const urgencyFields = (
    <>
      <Field label="Urgency">
        <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
          <option value="urgent">Urgent — appointment requested today</option>
          <option value="emergency">Emergency — priority scheduling</option>
        </Select>
      </Field>
      <Field
        label="Reason for visit"
        hint="Record the caller's words. This prototype does not provide medical triage."
      >
        <Textarea
          rows={2}
          placeholder="Briefly describe the appointment request"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
    </>
  );
  const typeField = (
    <Field label="Appointment type">
      <Select
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setSlot(null);
          setProvider('p1');
        }}
      >
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label} · {t.duration} min
          </option>
        ))}
      </Select>
    </Field>
  );
  const summary = (
    <Card className="nv-summary">
      <h3>Booking summary</h3>
      <Tag tone="urgent">{urgency === 'emergency' ? 'Emergency · Priority' : 'Urgent · Today'}</Tag>
      <dl>
        <dt>PATIENT</dt>
        <dd>{patient?.name ?? 'Not selected'}</dd>
        {patient?.alerts.map((a) => (
          <dd key={a}>
            <small>{a}</small>
          </dd>
        ))}
        <dt>APPOINTMENT</dt>
        <dd>
          {appointmentType.label}
          <small>{appointmentType.duration} minutes</small>
        </dd>
        <dt>DATE</dt>
        <dd>Tue, 6 October 2026</dd>
        <dt>PROVIDER & ROOM</dt>
        <dd>
          {slot?.provider ?? 'Not selected'}
          <small>{slot ? slot.time + ' · ' + slot.room : 'Available slots shown next'}</small>
        </dd>
      </dl>
      <p className="nv-readonly-note">
        Fictional records. No appointment is sent to a real clinic.
      </p>
    </Card>
  );
  return (
    <ClinicShell>
      <div className="nv-eyebrow">Appointments / Emergency booking</div>
      <div className="nv-page-title">
        <div>
          <h1>Find same-day care</h1>
          <p>
            {simplified
              ? 'Capture urgency, then choose the earliest compatible same-day time.'
              : 'Find the right care, one step at a time.'}
          </p>
        </div>
        <Tag>Northside · 6 Oct</Tag>
      </div>
      <div className="nv-steps">
        {steps.map((label, i) => (
          <div key={label} className={'nv-step ' + (i === step ? 'active' : '')}>
            <span>{i < step ? '✓' : i + 1}</span>
            {label}
          </div>
        ))}
      </div>
      <div className="nv-layout" data-playground-screen={confirmed ? 'confirmation' : active}>
        <Card>
          {!dismissed && state === 'loading' ? (
            <div className="nv-empty" role="status">
              <div className="nv-loading" />
              Checking clinic availability…
            </div>
          ) : !dismissed && state === 'error' ? (
            <div className="nv-empty" role="alert">
              <h2>Availability could not be loaded</h2>
              <p>Your patient details are still here.</p>
              <Button onClick={() => setDismissed(true)}>Try again</Button>
            </div>
          ) : !dismissed && state === 'no-provider-available' ? (
            <div className="nv-empty">
              <h2>No matching providers available</h2>
              <p>No compatible provider and operatory pair can fit this appointment.</p>
              <Button variant="secondary" onClick={reset}>
                Review appointment details
              </Button>
            </div>
          ) : confirmed ? (
            <div className="nv-success">
              <div className="nv-success-icon">✓</div>
              <h2>Appointment confirmed</h2>
              <p>
                {patient?.name} · {slot?.time} · 6 October 2026
              </p>
              <p>
                {slot?.provider}
                <br />
                {slot?.room} · {appointmentType.duration} minutes
              </p>
              <Tag tone="urgent">{urgency === 'emergency' ? 'Emergency' : 'Urgent'}</Tag>
              <p className="nv-readonly-note">
                Prototype confirmation only. Nothing was booked externally.
              </p>
              <Button onClick={reset}>Book another appointment</Button>
            </div>
          ) : (
            <>
              <div className="nv-label">
                <span>
                  Step {step + 1} of {steps.length}
                </span>
                <Tag tone="urgent">
                  {urgency === 'emergency' ? 'Emergency · Priority' : 'Urgent · Today'}
                </Tag>
              </div>
              <h2>{steps[step]}</h2>
              {active === 'patient' && <>{patientPicker}</>}
              {active === 'urgency' && (
                <>
                  {urgencyFields}
                  {typeField}
                  <div className="nv-notice">
                    Priority is recorded from the caller's request. Choose a same-day time next; a
                    compatible provider and room will be recommended.
                  </div>
                </>
              )}
              {active === 'type' && typeField}
              {active === 'provider' &&
                providers
                  .filter((p) => p.procedures.includes(type))
                  .map((p) => (
                    <button
                      className="nv-choice"
                      key={p.id}
                      aria-pressed={provider === p.id}
                      onClick={() => {
                        setProvider(p.id);
                        setSlot(null);
                      }}
                    >
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.specialty} · {p.availability.start}–{p.availability.end}
                        </small>
                      </span>
                      <span>{provider === p.id ? '✓' : '→'}</span>
                    </button>
                  ))}
              {active === 'slots' && (
                <>
                  <div className="nv-notice" data-playground-id="slot-guidance">
                    <strong>
                      {urgency === 'emergency'
                        ? 'Emergency · Priority scheduling'
                        : 'Urgent · Appointment today'}
                    </strong>
                    <br />
                    Recommended same-day availability · {appointmentType.duration} minutes
                    <br />
                    <small>
                      One compatible provider and room is recommended for each time. All
                      recommendations respect full-duration availability.
                    </small>
                  </div>
                  <div className="nv-slot-grid" data-playground-id="appointment-slots">
                    {slots.slice(0, 12).map((s) => (
                      <button
                        key={s.id}
                        className="nv-choice"
                        aria-pressed={slot?.id === s.id}
                        onClick={() => setSlot(s)}
                      >
                        <strong>{s.time}</strong>
                        <small>{s.provider}</small>
                        <small>
                          {s.room} · {s.duration} min
                        </small>
                      </button>
                    ))}
                  </div>
                  {!slots.length && (
                    <p>No compatible slots. Go back to review appointment details.</p>
                  )}
                </>
              )}
              {active === 'operatory' && (
                <>
                  {slots
                    .filter((s) => s.time === slot?.time)
                    .map((s) => (
                      <button
                        key={s.id}
                        className="nv-choice"
                        aria-pressed={slot?.id === s.id}
                        onClick={() => setSlot(s)}
                      >
                        <span>
                          <strong>{s.room}</strong>
                          <small>
                            Available at {s.time} · Supports {appointmentType.label.toLowerCase()}
                          </small>
                        </span>
                        {slot?.id === s.id ? '✓' : '→'}
                      </button>
                    ))}
                </>
              )}
              {active === 'confirmation' && (
                <>
                  <div className="nv-notice">
                    <strong>{patient?.name}</strong>
                    <br />
                    {patient?.id} · {patient?.phone}
                  </div>
                  <h3>
                    {appointmentType.label} · {slot?.time}
                  </h3>
                  <p>
                    {slot?.provider}
                    <br />
                    {slot?.room} · {appointmentType.duration} minutes
                  </p>
                  <p>
                    <strong>Reason:</strong> {reason}
                  </p>
                  <Tag tone="urgent">
                    {urgency === 'emergency' ? 'Emergency · Priority' : 'Urgent · Today'}
                  </Tag>
                  <div
                    className="nv-confirm-summary-action"
                    data-playground-id="confirmation-summary-action"
                  >
                    <p>
                      Confirm this appointment for {patient?.name} at {slot?.time}.
                    </p>
                    <Button
                      data-playground-id="confirm-appointment"
                      data-playground-component="Button"
                      disabled={!patient || !slot || !reason.trim()}
                      onClick={() => setConfirmed(true)}
                    >
                      Confirm appointment
                    </Button>
                  </div>
                </>
              )}
              <div className="nv-actionbar">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                {active !== 'confirmation' && (
                  <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>
                    {active === 'urgency' ? 'Show same-day recommendations' : 'Continue'} →
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
        {summary}
      </div>
    </ClinicShell>
  );
}

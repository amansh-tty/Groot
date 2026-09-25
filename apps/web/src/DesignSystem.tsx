import { useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Radio,
  Select,
  Switch,
  Tabs,
  Tag,
  Textarea,
  tokens,
} from '@playground/design-system';
export function DesignSystem() {
  const [on, setOn] = useState(true);
  const [tab, setTab] = useState('appointments');
  return (
    <div className="ds-page">
      <div className="page-intro">
        <span className="eyebrow">NOVA / FOUNDATIONS & COMPONENTS</span>
        <h1>NOVA design system</h1>
        <p>
          The same components used in every NOVA exploration. Inspect and reuse{' '}
          <code>packages/design-system/src</code>.
        </p>
      </div>
      <div className="nova ds-catalog">
        <section>
          <header>
            <span>01</span>
            <h2>Color</h2>
            <p>Calm surfaces. Clear signals.</p>
          </header>
          <div className="ds-colors">
            {Object.entries(tokens.colors).map(([name, value]) => (
              <div key={name}>
                <span style={{ background: value }} />
                <strong>{name}</strong>
                <small>{value}</small>
              </div>
            ))}
          </div>
        </section>
        <section>
          <header>
            <span>02</span>
            <h2>Typography</h2>
            <p>System sans · Regular / Medium / Semibold</p>
          </header>
          <div className="ds-type">
            {tokens.typography.map((size) => (
              <div key={size}>
                <small>{size}px</small>
                <span style={{ fontSize: size }}>Care starts with clarity.</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <header>
            <span>03</span>
            <h2>Spacing & radius</h2>
            <p>4px subdivisions, an 8px rhythm.</p>
          </header>
          <div className="ds-spaces">
            {tokens.spacing.map((size) => (
              <div key={size}>
                <span style={{ width: size, height: 24 }} />
                <small>{size}px</small>
              </div>
            ))}
          </div>
          <div className="ds-radii">
            {tokens.radius.map((radius) => (
              <div key={radius} style={{ borderRadius: radius }}>
                {radius}px
              </div>
            ))}
          </div>
        </section>
        <section>
          <header>
            <span>04</span>
            <h2>Buttons & inputs</h2>
            <p>Try the real controls.</p>
          </header>
          <div className="ds-row">
            <Button onClick={() => setOn(!on)}>Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Quiet action</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="ds-form">
            <Field label="Patient name">
              <Input placeholder="e.g. Avery Morgan" />
            </Field>
            <Field label="Appointment type">
              <Select defaultValue="assessment">
                <option value="assessment">Emergency assessment</option>
                <option value="treatment">Urgent treatment</option>
              </Select>
            </Field>
            <Field label="Scheduling note">
              <Textarea placeholder="Additional context for the team" rows={3} />
            </Field>
          </div>
        </section>
        <section>
          <header>
            <span>05</span>
            <h2>Selection controls</h2>
          </header>
          <div className="ds-row">
            <Checkbox label="Send a reminder" defaultChecked />
            <Radio label="Morning" name="period" defaultChecked />
            <Radio label="Afternoon" name="period" />
            <Switch label="Available providers only" checked={on} onChange={setOn} />
          </div>
        </section>
        <section>
          <header>
            <span>06</span>
            <h2>Tags, cards, tabs & avatars</h2>
          </header>
          <div className="ds-row">
            <Tag>Front desk</Tag>
            <Tag tone="urgent">Urgent · Today</Tag>
            <Tag tone="success">Confirmed</Tag>
            <Avatar name="Avery Morgan" />
          </div>
          <Card>
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: 'appointments', label: 'Appointments' },
                { id: 'patients', label: 'Patients' },
              ]}
            />
            <h3>{tab === 'appointments' ? 'Today at Northside' : 'Patient directory'}</h3>
            <p>
              {tab === 'appointments'
                ? 'Your next appointment is at 10:30.'
                : 'Four fictional patient records are available.'}
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}

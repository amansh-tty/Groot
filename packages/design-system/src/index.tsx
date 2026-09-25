import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';
import './tokens.css';
export const tokens = {
  colors: {
    ink: '#20352f',
    muted: '#61716b',
    accent: '#306950',
    surface: '#ffffff',
    canvas: '#f3f5f1',
    border: '#dbe3dc',
    urgent: '#985128',
  },
  spacing: [4, 8, 12, 16, 24, 32, 48],
  radius: [4, 8, 12, 16],
  typography: [12, 14, 16, 20, 28, 36],
};
export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button {...props} className={'nv-button nv-' + variant + ' ' + className} />;
}
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={'nv-input ' + className} />;
}
export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={'nv-input ' + className} />;
}
export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={'nv-input ' + className} />;
}
export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="nv-check">
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}
export function Radio({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="nv-check">
      <input type="radio" {...props} />
      {label}
    </label>
  );
}
export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="nv-switch"
      onClick={() => onChange(!checked)}
    >
      <span data-on={checked} />
      {label}
    </button>
  );
}
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'urgent' | 'success';
}) {
  return <span className={'nv-tag nv-tag-' + tone}>{children}</span>;
}
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={'nv-card ' + className} />;
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="nv-tabs" aria-label="Sections">
      {items.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="nv-avatar" aria-label={name}>
      {name
        .split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="nv-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function ClinicShell({ children }: { children: ReactNode }) {
  return (
    <div className="nova">
      <header className="nv-clinic-header">
        <div className="nv-logo">
          <span>✳</span>NOVA <b>DENTAL</b>
        </div>
        <span className="nv-location">
          Northside clinic <span>⌄</span>
        </span>
        <div className="nv-user">
          <Avatar name="Alex Parker" />
          <span>
            Alex Parker<small>Front desk</small>
          </span>
        </div>
      </header>
      <div className="nv-clinic-body">
        <aside className="nv-clinic-nav">
          <span>WORKSPACE</span>
          <p>Overview</p>
          <p className="active">Appointments</p>
          <p>Patients</p>
          <p>Providers</p>
          <div className="nv-clinic-note">
            Fictional product
            <br />
            Exploration workspace
          </div>
        </aside>
        <main className="nv-content">{children}</main>
      </div>
    </div>
  );
}

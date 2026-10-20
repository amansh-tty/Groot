import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, CSSProperties } from 'react';
import { colors, observed, textStyles } from './tokens';
import './styles.css';
export { colors, conflictingColors, observed, textStyles } from './tokens';

export function DesignSystemRoot({ children }: { children: ReactNode }) {
  const variables = Object.fromEntries(
    Object.entries(colors).map(([name, value]) => ['--figma-' + name.replaceAll('/', '-'), value]),
  );
  return (
    <div
      className="figma-system"
      style={{ ...variables, fontFamily: observed.fontFamily } as CSSProperties}
    >
      {children}
    </div>
  );
}
export type ButtonState = 'main' | 'hover' | 'pressed' | 'focused' | 'disabled';
/** Primary / Large / text-only. previewState is for catalog inspection, not app state. */
export function Button({
  previewState,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { previewState?: ButtonState }) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || previewState === 'disabled'}
      data-preview-state={previewState}
      className={'figma-button ' + className}
    />
  );
}
export function Text({
  variant = 'Regular/Type@16',
  style,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { variant?: keyof typeof textStyles }) {
  return <p {...props} style={{ ...textStyles[variant], ...style }} />;
}
/** Surface extracted from Pricing Plan / Web, not a reconstructed full pricing card. */
export function Card({ style, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      style={{
        background: observed.pricingCard.background,
        borderRadius: observed.pricingCard.radius,
        padding: observed.pricingCard.padding,
        ...style,
      }}
    />
  );
}
/** This named shadow was observed on an icon button; kept separate from the text button. */
export function EffectSample({ children }: { children: ReactNode }) {
  return <div style={{ boxShadow: observed.iconButtonShadow, padding: 24 }}>{children}</div>;
}

/** Dashboard-specific variants observed in Figma frame 129:9331. */
export function DashboardPanel({ style, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <Card
      {...props}
      style={{ background: colors['Primary/0'], borderRadius: 10, padding: 24, ...style }}
    />
  );
}
export function DashboardAction({
  outlined = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { outlined?: boolean }) {
  return (
    <Button
      {...props}
      className={`figma-dashboard-action ${outlined ? 'outlined' : ''} ${className}`}
    />
  );
}

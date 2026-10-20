import { useState } from 'react';
import {
  Button,
  Card,
  DesignSystemRoot,
  EffectSample,
  Text,
  colors,
  conflictingColors,
  observed,
  textStyles,
  type ButtonState,
} from '../../../packages/design-system/src';
import './showcase.css';

const source = 'https://www.figma.com/design/4Ebg54utk4cPVLQFNY1Mja?node-id=202-3391';
export default function Showcase({ screen = '' }: { screen?: string }) {
  const [clicks, setClicks] = useState(0);
  return (
    <DesignSystemRoot>
      <main className="figma-showcase" data-playground-screen={screen || 'foundations'}>
        <header>
          <p className="catalog-label">FIGMA REFERENCE / REUSABLE FOUNDATION</p>
          <h1>Pickolab design system</h1>
          <p>A small, source-backed starting point for this user project.</p>
          <p className="catalog-note">
            Font specification: Plus Jakarta Sans. No font binary was supplied; this preview uses
            the installed font when available, otherwise sans-serif. Typography is not
            pixel-verified.
          </p>
        </header>
        {(!screen || screen === 'foundations') && (
          <>
            <section aria-labelledby="colors">
              <h2 id="colors">Observed color styles</h2>
              <p>Resolved named values, not a reconstructed variable collection.</p>
              <div className="swatch-grid">
                {Object.entries(colors).map(([name, color]) => (
                  <div className="swatch" key={name}>
                    <div style={{ background: color }} />
                    <strong>{name}</strong>
                    <code>{color}</code>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2>Conflicting definitions</h2>
              <p>
                Both values are preserved. The reusable Card explicitly uses the pricing-card value.
              </p>
              <div className="swatch-grid">
                {Object.entries(conflictingColors).flatMap(([name, sources]) =>
                  Object.entries(sources).map(([origin, color]) => (
                    <div className="swatch" key={name + origin}>
                      <div style={{ background: color }} />
                      <strong>{name}</strong>
                      <span>{origin}</span>
                      <code>{color}</code>
                    </div>
                  )),
                )}
              </div>
            </section>
            <section>
              <h2>Typography</h2>
              <p>
                The board lists 12–72px across regular, medium, semibold and bold. Only these
                inspected style definitions are implemented.
              </p>
              {Object.entries(textStyles).map(([name, value]) => (
                <div className="type-sample" key={name}>
                  <code>
                    {name} · {value.fontSize}px / {value.lineHeight} · {value.letterSpacing}
                  </code>
                  <Text variant={name as keyof typeof textStyles}>
                    Make room for your next idea.
                  </Text>
                </div>
              ))}
            </section>
            <section>
              <h2>Component measurements</h2>
              <Card>
                <Text>Pricing-card surface: 32px padding and 12px corners.</Text>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: observed.pricingCard.featureGap,
                  }}
                >
                  <Text>Feature rows: 24px apart</Text>
                  <Text>Icon-to-label gap: 12px</Text>
                </div>
              </Card>
              <p>These are component measurements, not a universal spacing or radius scale.</p>
            </section>
          </>
        )}
        {screen === 'components' && (
          <>
            <section>
              <h2>Primary button · Large · Text only</h2>
              <p>
                Native button with observed main, hover, pressed, focused and disabled treatments.
                Focus it with Tab; activate with Enter or Space.
              </p>
              <div className="button-states">
                {(['main', 'hover', 'pressed', 'focused', 'disabled'] as ButtonState[]).map(
                  (state) => (
                    <div key={state}>
                      <span>{state}</span>
                      <Button previewState={state} onClick={() => setClicks((value) => value + 1)}>
                        Label
                      </Button>
                    </div>
                  ),
                )}
              </div>
              <p role="status">Button activations: {clicks}</p>
              <p className="catalog-note">
                Figma main: 52px high / 30px radius. Other inspected states: 50px / 60px radius.
                Static samples preserve this discrepancy; live interactions retain 52px height to
                prevent movement. Keyboard focus adds an outer outline.
              </p>
            </section>
            <section>
              <h2>Reusable card surface</h2>
              <Card aria-label="Reusable pricing card surface">
                <Text variant="Semibold/Type@32">A composable surface</Text>
                <Text>
                  Extracted from Pricing Plan / Web: #F3F5F7, 12px corners, 32px padding. This
                  demonstration combines the real Card, Text and Button exports.
                </Text>
                <Button onClick={() => setClicks((value) => value + 1)}>
                  Try the shared button
                </Button>
              </Card>
              <p>
                The full pricing card and its illustration/icons are intentionally not reproduced.
              </p>
            </section>
            <section>
              <h2>Button/Card/Small effect</h2>
              <EffectSample>
                <Text>Observed shadow: 4px 8px 24px, #246BFD40.</Text>
              </EffectSample>
              <p>
                Seen on the large primary icon button. Displayed as an effect sample, not applied to
                the text button. CSS uses box-shadow to represent the named drop-shadow definition;
                Figma’s generated CSS used a different blur conversion.
              </p>
            </section>
          </>
        )}
        {screen === 'notes' && (
          <section>
            <h2>Source & limitations</h2>
            <p>
              <a href={source} target="_blank" rel="noreferrer">
                Open the source selection in Figma
              </a>
            </p>
            <ul>
              <li>
                Source selection 202:3391; pricing surface 164:19181; primary text button 121:6102;
                state nodes 2:927, 2:933, 2:939 and 2:945.
              </li>
              <li>
                Observed only: resolved styles, component geometry and variant names. No verified
                variable collections, aliases, modes, or Code Connect mapping.
              </li>
              <li>
                Secondary/100 and neutral colors have conflicting definitions; both are shown under
                Foundations.
              </li>
              <li>
                Urbanist and Inter also occur in the file. They are not assumed to be the product
                font. No font binaries are bundled.
              </li>
              <li>
                Secondary/minimal buttons, smaller sizes, icon buttons, testimonial/pricing
                compositions, benefit blocks, success stories and the toggle are inventoried but not
                implemented. Responsive variant names do not establish breakpoints.
              </li>
              <li>
                Catalog layout and semantic HTML are implementation choices. No new product facts,
                forms, booking flow, theme modes or global spacing scale are invented.
              </li>
              <li>
                The supplied primary button colors are preserved; white text on the default purple
                may not meet normal-text AA contrast. Contrast remediation requires a design
                decision.
              </li>
            </ul>
          </section>
        )}
      </main>
    </DesignSystemRoot>
  );
}

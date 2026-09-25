# Emergency Booking — Simplified

Fictional NOVA DENTAL exploration. Read ../../context and ../../packages/design-system/src before editing. Entry: src/App.tsx. Declared screens/states: prototype.config.ts. Shared fixtures: ../../data/*.json.

## Prototype assumptions

- Fixed date of 6 October 2026 and the Northside clinic.
- Local preview state only; refresh discards in-progress form input and simulated bookings.
- No medical triage or real appointment is performed.
- Urgency is recorded from the caller. Only full-duration compatible provider/operatory slots are offered.

## Learnings

None validated yet. This exploration is not evidence that the proposed workflow is better.

## Optional external-agent test prompts

- Read NOVA context and design system. Create a third emergency-booking alternative and preserve existing explorations.
- Modify Simplified Booking to surface same-day availability first. Reuse existing components.
- Read open feedback and improve urgency visibility.
- Create an error state for Patient Search without changing established design tokens.

Use Create alternative before an independent exploration. Changes to this directory appear automatically in Playground; syntax errors retain the last successful preview.

## V2 iteration

Stable targets include confirm-appointment, appointment-slots and slot-guidance. Feedback is stored as the existing JSON array. The CTA was moved beside its confirmation details in response to the live acceptance comment; that comment remains open for designer review.

Appointment slot-card controls are defined in controls.json, imported by prototype.config.ts and bound explicitly in App.tsx. Live preview is temporary until Save changes; saved values are authoritative for external agents. Default gap is 16 px; the V2 manual acceptance exercise may leave it at 24 px.

# Patient Search

Fictional NOVA DENTAL exploration. Read ../../context and ../../packages/design-system/src before editing. Entry: src/App.tsx. Declared screens/states: prototype.config.ts. Shared fixtures: ../../data/*.json.

## Prototype assumptions

- Fixed date of 6 October 2026 and the Northside clinic.
- Local preview state only; refresh discards in-progress form input and simulated bookings.
- No medical triage or real appointment is performed.
- Search uses a 250ms simulated delay and four fictional patient records.

## Learnings

None validated yet. This exploration is not evidence that the proposed workflow is better.

## Optional external-agent test prompts

- Read NOVA context and design system. Create a third emergency-booking alternative and preserve existing explorations.
- Modify Simplified Booking to surface same-day availability first. Reuse existing components.
- Read open feedback and improve urgency visibility.
- Create an error state for Patient Search without changing established design tokens.

Use Create alternative before an independent exploration. Changes to this directory appear automatically in Playground; syntax errors retain the last successful preview.

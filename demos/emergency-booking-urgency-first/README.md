# Emergency Booking — Urgency First

A designer-requested exploration: patient → stated urgency and appointment type → recommended same-day slots → confirmation.

## Decision rationale

Prioritize the caller's urgency and compatible same-day availability. Recommend one provider/room pair per time rather than asking front-desk staff to choose these independently.

## Reversible assumptions

Use the first compatible pair at each time; this is a scheduling simplification, not a clinical preference. The user can go back and revise appointment details. Every displayed pair respects full-duration availability through shared data/scheduling.ts.

## Constraints

All data is fictional; Northside, 6 October 2026. No diagnosis, clinical triage, real booking or network calls. Reuse NOVA components and existing data. Alternative source is independent of its siblings.

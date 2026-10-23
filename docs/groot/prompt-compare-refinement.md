# Compact prompts and comparison hierarchy

VariationSummary owns a wrapping title, current marker and two-line latest-prompt excerpt. When no recorded prompt exists, the original metadata description is labeled Direction. Prompt history reuses PromptExcerpt. Long text opens beside its own card/entry in a grayscale native popover, with 20px content padding, readable line spacing, a sticky labeled header/close button and bounded internal scrolling. It repositions on resize and ancestor scrolling; narrow screens use an inset placement inside the viewport. No prompt content or imported prototype was fabricated or changed.

Comparison begins with a named Current flow card (A), followed by Compare with and an explicit native select. Related variations and other explorations form separate option groups. Compare stays disabled until a different target is selected and opens that exact pair. Existing independent pane controls remain intact.

Validation: typecheck, lint, formatting and production build passed. All eight workflow browser tests passed after introducing explicit selection. A further targeted test passed after the final positioning fix, covering a 20-line asynchronously loaded prompt, desktop and 390px viewport bounds, keyboard dismissal and the original Groot session interactions. The static public-demo smoke test also passed. The tests use isolated temporary workspaces.

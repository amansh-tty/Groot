# Groot interface worklog

## Approved design direction

The current interface follows the approved home, editor and centered-dialog image studies, with Figma-style file organization and a Paper-style vertical toolbar. Groot uses its own monochrome shell. Imported prototypes retain their own design systems and colors.

## Interface owners

StudioApp owns Home, project destinations, file tabs and recent explorations. PrototypeView owns compact variations, recorded prompt history, the vertical canvas toolbar, named screens, resizing and the default-open inspector. Controls, Preview and Comments separate the editing/review tasks. Shared Button and Dialog primitives preserve consistent geometry, focus and keyboard behavior.

The local filesystem remains the source of truth. Successful compilation updates the sandboxed preview; failures retain the last working build. Feedback resolution belongs to the designer. Variations preserve their parent and copy the exploration independently. Screen/state creation prepares a handoff for an external coding agent rather than generating code inside the application.

## Validation and source preservation

Implementation plan: [implementation-plan.md](implementation-plan.md). Panel refinements: [panel-refinements.md](panel-refinements.md). Visual and interaction verification: [../../design-qa.md](../../design-qa.md). Integration details: [../integration/port.md](../integration/port.md).

Source-backed previews use the actual imported files. Generated mockup content is not substituted into prototypes. Existing compiler boundaries, JSON persistence, design-system ownership and project isolation remain intact. No additional runtime framework or dependencies were introduced for the interface.

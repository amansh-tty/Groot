# Approved Groot workspace

Implement the approved home, editor and centered handoff dialog using the three latest generated images. Their purple shell selection accents are explicitly rejected; use grayscale only. Reuse source-backed live thumbnails, sandbox iframe, compiler recovery, feedback and full-directory alternatives.

Owners: StudioApp.tsx for file tabs and home navigation; PrototypeView.tsx for variations, vertical tools, screen navigation, open inspector and screen/state handoff; studio.css for monochrome typography/spacing and responsive rules; Workbench detail boundary for optional read-only prompts.json history. Shared dialog remains keyboard accessible and gains explicit viewport centering. No raster assets needed: previews use real source and existing icon library.

Prompt history schema: optional exploration-local prompts.json array of {prompt, createdAt}; display recorded entries only and show empty/error states. Agents write it alongside source changes. Do not fabricate history or silently overwrite invalid files.

Validate unit tests, typecheck, lint, format, build and isolated browser workflows; add meaningful coverage for tab navigation, default-open inspector, screen/state handoff, prompt history and monochrome responsive structure. Inspect home/editor/dialog against approved mockups. Preserve imported source and NOVA.

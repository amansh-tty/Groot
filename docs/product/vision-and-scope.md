# Vision, user problem and V0 scope

> Historical V0 scope. Current implementation follows [V1 external-agent workbench](v1.md).

Playground helps product designers explore real interactions using their own product knowledge, models and reusable components. It supports design judgment by reducing repeated context entry and disposable implementation work.

The initial user designs an existing digital product, knows its users and constraints, and may understand basic frontend concepts without wanting to code. Their recurring problem is carrying context through prototype iterations while retaining previous directions.

V0 must support local installation, resumable onboarding, personal AI connection, projects, editable structured context, functional React generation and modification, isolated interactive preview, saved named versions, alternative exploration, restore and durable reopening. Basic secret-free project import/export and a fictional dental-clinic example complete the release.

The primary acceptance journey is: install → launch → onboard → connect AI → create project → enter context → generate → interact → modify → save → duplicate → restore → restart and recover. Every transition must work. The full journey does not work in Phase 1.

Out of scope: infinite canvas, collaboration, cloud infrastructure, Playground accounts, production-codebase sync, autonomous background agents, visual property editing, annotation/review tooling, full Git branching and arbitrary package installation.

The default interface uses dark neutral surfaces, configurable restrained accents, strong focus/selection states and 4/8px spacing. Prioritize desktop with an accessible smaller-screen fallback. Avoid an IDE-shaped product or decorative AI imagery.

## Roadmap

First validate the six phases in the implementation plan with real users. Later explore annotations, galleries, visual properties, component ingestion, canvas organization, codebase connections and optional collaboration only when research establishes their value. Do not make these prerequisites for V0.

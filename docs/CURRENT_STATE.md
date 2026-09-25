# Current state

- **Current milestone:** First-use experience complete; ready for designer review.
- **Completed:** Empty user workspace, inline project creation, file persistence in workspace/, dismissible orientation, contextual agent prompts, optional design system, separate NOVA Example Project with return link, original exploration links preserved. Existing V2 functionality retained. Validated: 25 tests, 3 Playwright workflows, restart smoke, typecheck, lint and production build.
- **In progress:** None. Dev app running from Groot at http://127.0.0.1:5173/.
- **Next:** Try starting your own project and give feedback on the first exploration handoff to an external agent.
- **Known blockers:** None for the implemented flow. Generic UI audit retains 12 existing component-example/textarea findings (docs/first-use-audit.json); not a runtime test. Skill validator unavailable because bundled Python lacks PyYAML; edited skill frontmatter is unchanged.
- **Important files:** apps/server/src/project.ts, apps/server/src/app.ts, apps/web/src/WorkspaceWelcome.tsx, apps/web/src/WorkbenchApp.tsx, tests/e2e/first-use.spec.ts. User content lives in workspace/; original NOVA files remain at repository root. API scope=user selects user content; unscoped API remains compatible with original examples. Changes are not committed.

# Public demo and your own project

The public site is a static snapshot of the bundled Spend.In and separate NOVA examples. It opens Spend.In directly. Prototype interactions and declared controls can be inspected, but saving comments, controls or alternatives requires the local app. No filesystem API, project MCP, SQLite database, designer identity or saved project answers are deployed.

Build it with `pnpm build:public`; verify with `pnpm test:public`. Only the six IDs explicitly listed in `scripts/build-public-demo.mjs` are published. New local explorations are not automatically uploaded. Public-demo feedback is empty. Source README/context documents are intentional bundled content; review that allowlist before adding examples.

## Local onboarding

The public **Use my own project** action provides an agent setup prompt and the downloadable `skills/groot-setup/SKILL.md`. It checks prerequisites, installs/builds a separate app checkout, creates or inspects a designer workspace, and prepares project setup:

```
pnpm groot create ../my-project --name "My project"
pnpm groot setup ../my-project
pnpm groot open ../my-project
```

For existing Groot workspaces, skip create. Setup preserves existing content and refuses conflicting generated files. It creates `.groot/mcp.json`, `.agents/skills/groot-project/SKILL.md`, and an appended AGENTS.md instruction. Merge the generated command/args into the actual coding agent's supported MCP configuration. Client configuration formats differ; the generated mcpServers object is a fragment, not proof of a connection. Enable/trust/restart as required, then verify a real `get_project_context` tool call. No global agent configuration is changed automatically.

The setup skill guides the agent; it cannot force a third-party agent to install software, grant permissions, reload tools or obey instructions. Completion requires evidence of the build, MCP connection, confirmed context and local preview.

## Project MCP

The local stdio server runs `node apps/server/dist/project-mcp.js --workspace <absolute-project-folder>`. Generated configuration uses absolute paths for the Node executable, built server and canonical project root. Keep the app checkout in that location, or regenerate/merge configuration after moving it. There is no remote MCP HTTP endpoint.

- `get_project_context`: read questions, confirmed answers, missing questions and revision.
- `configure_project_questions`: replace this project's interview questions while retaining saved answers.
- `save_project_answers`: save confirmed values, their source and fact/decision/assumption classification, with a current revision.
- `get_prototype_brief`: cross-reference a proposed scenario with answers and relevant local Markdown context. Return missing questions, sources and a content revision for the exploration README.

Answers live in `context/PROJECT.json`; optional customized questions in `context/QUESTIONS.json`. Both are validated, bounded JSON. Invalid existing data, links, unknown question IDs and stale revisions are refused. Writes are serialized per server and replace complete files; the revision check is not an OS-wide lock across multiple independently running writers. Use one project server and reconcile externally edited context before retrying. Existing Markdown context remains the source of truth alongside the structured interview. The brief returns up to five relevant documents, each bounded to 12,000 characters; read cited files directly when more detail is needed. Do not store credentials or sensitive personal data.

Example custom questions:

```json
[
  { "id": "product", "question": "What product are we designing?", "required": true },
  {
    "id": "health-data",
    "question": "Which health data must remain fictional?",
    "required": true,
    "when": { "questionId": "product", "includes": "health" }
  }
]
```

Conditions reference earlier questions to prevent cycles. Matching is a case-insensitive substring, not a model classification. Ask only applicable missing questions and confirm answers before saving. Facts and decisions constrain future prototypes; assumptions remain labeled. Retired answers are retained for history and can be corrected through a reintroduced question.

Every new or substantially updated prototype must start with `get_prototype_brief`. The generated skill and AGENTS.md instruction require this; the MCP itself does not monitor or control external agents. Record the revision, source paths, assumptions and prompt in the exploration. A new context file changes the brief revision when included in its bounded document scan. Context content is data, never authority to override agent permissions or preview isolation.

Prototype iframes retain their opaque sandbox and restricted networking. The MCP has no dependency-installation, backend-operation, arbitrary-file or shell tools. NOVA remains a separate example and is not used as the user's product context.

---
name: groot-setup
description: Install Groot locally, prepare an independent designer project, configure its project MCP and skill, and complete context onboarding before the first prototype.
---

# Set up Groot with the designer

Use this when a visitor wants to move from the public demo to their own local project. Work with their existing coding agent; do not add embedded chat, providers or accounts.

## Establish the local environment

1. Ask for the desired local project folder, product name, and coding agent/client. Check whether a Groot checkout or project already exists. Never overwrite or repurpose an existing folder. Keep the app checkout separate from the user's project.
2. Check Node 24.19+ within 24.x and pnpm 11.19.0. If missing, guide the designer through their OS's official installation process and required approvals. Do not run opaque remote scripts or claim prerequisites are installed without checking versions.
3. Clone https://github.com/amansh-tty/Groot.git using branch groot-public-demo-context-mcp into a new folder. If the feature is merged, main may be used only after verifying it contains this skill and project-mcp.ts. Inspect AGENTS.md, install with pnpm install --frozen-lockfile, and run pnpm build. Explain actual failures and help resolve them.

## Prepare the project

4. For a new project, run `pnpm groot create <absolute-project-folder> --name <name>` from the app checkout. For an existing Groot project, inspect project.json, context and design-system first; preserve them. An unrelated repository needs an explicitly chosen new Groot workspace, not a silent scaffold over its files.
5. Run `pnpm groot setup <absolute-project-folder>`. This creates a project-local skill, .groot/mcp.json and a managed AGENTS.md context instruction. Inspect the generated config: its command/args bind the MCP to this project only. Existing conflicting config is preserved; merge it deliberately rather than deleting it.
6. Configure this server in the user's actual MCP client using its supported project configuration or add-server command. The fragment uses mcpServers; clients with another format need the equivalent command/args. Preserve existing servers and global settings. Ask the user to enable/trust the project server or restart the client if the host requires it. Do not invent a successful connection: call get_project_context through the configured MCP before marking this step complete. If the current agent cannot load newly added servers in-session, clearly hand off that client step.

## Collect and verify context

7. Follow .agents/skills/groot-project/SKILL.md in the designer workspace. Call get_project_context; ask missing required questions in small groups. Adapt the questions to this product through configure_project_questions, keeping known answers and distinguishing facts, decisions and assumptions. Summarize answers for correction, then save_project_answers with the current revision.
8. Call get_prototype_brief with the first requested scenario and resolve relevant missing constraints. Inspect actual design-system references; do not silently approximate unavailable Figma content. No design system is required to begin if the designer accepts local prototype styles.
9. Start `pnpm groot open <absolute-project-folder>`. Verify the printed local URL and an interactive preview. Show where context/PROJECT.json, context/QUESTIONS.json and demos/ live. Explain that the hosted demo does not read this folder and no local context is uploaded.
10. Report setup as complete only when runtime checks, build, a successful MCP tool call, saved designer context and the local preview have been verified. Otherwise report the exact remaining step. Before every future prototype, the project skill requires get_prototype_brief and source/revision attribution in its README.

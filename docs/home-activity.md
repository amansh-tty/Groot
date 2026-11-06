# Home activity

Home lists projects with search, Projects/Recents, latest recorded prompts and project-wise repository contributions. It has no project-specific sidebar. Opening a project reveals its Overview, Start Here, design system and explorations. Project documents remain under Start Here → Project files; planning boards are another independent file type.

## Pull requests

The repository is an optional field on each project's project.json, set at creation or through Start Here → Project repository. No app repository is assumed for NOVA, Spend.In or a newly created product. Missing repository links are shown explicitly. The local server validates owner/repository, proxies only GitHub's public pull-request endpoint and caches successful responses per repository for five minutes. Private repositories and account authentication are not supported.

Counts apply to the latest twenty updated PRs, not all-time or personal contributions. Home groups the summary by project; each project's overview can show its recent PR titles. GitHub failures show a retry action and repository link. Bundled public projects intentionally have no linked personal repositories. New project and board actions in the public demo guide local installation.

Reference: [GitHub's public pull-request listing API](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests).

## Codex allowance

Choose **Read local allowance** in the local app. Groot uses the installed, already signed-in Codex CLI; it does not add an account or ask for an API key. The server runs `codex app-server --listen stdio://` from the temporary directory, sends `initialize`, `initialized` and `account/rateLimits/read`, then terminates the process. No thread, turn or generation is started. It has a twelve-second timeout and response-size bound.

Only validated percentages, reported window durations, reset timestamps and a check timestamp reach the UI. No auth files are read by Groot, and no raw account payload is returned. Window names come from actual durations: 300 minutes is five hours; 10,080 minutes is weekly. Missing data is unavailable rather than zero. Refresh is explicit; successful reads are shared/cached for sixty seconds in server memory. A failed refresh keeps the previous check labeled as such. A full page reload clears the displayed personal information.

Codex must be on the local server's PATH. Where needed, set the server-only `GROOT_CODEX_EXECUTABLE` environment variable to its executable path and restart Groot. This is an executable path, not a shell command; wrappers requiring a shell are not supported. Sign in through Codex itself before retrying. The CLI account may differ from an account active in another coding tool.

The public Vercel site cannot read the visitor's local Codex account. It offers local installation instead and never requests or snapshots allowance data. No runtime account data may be committed or included by `build:public`.

Reference: [official Codex app-server account rate limits](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt).

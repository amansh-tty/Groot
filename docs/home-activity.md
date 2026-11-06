# Home activity

Home prioritizes PR activity, coding-agent allowance and the exploration gallery. Project documents remain available under **Start Here → Project files**.

## Pull requests

This first version reads the latest twenty updated pull requests from the public `amansh-tty/Groot` repository. Open and merged counts apply to that returned set, not all-time contributions or a signed-in visitor. The repository and **Groot development** label stay visible when viewing the bundled NOVA or Spend.In project. Other repositories and private GitHub account connections are not configured in this version.

The local server proxies this fixed public endpoint and caches successful responses for five minutes. The public static demo calls GitHub directly without credentials. GitHub rate limits, connection failures and malformed responses display a retry message and repository link. Existing loaded results remain visible after a refresh failure.

Reference: [GitHub's public pull-request listing API](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests).

## Codex allowance

Choose **Read local allowance** in the local app. Groot uses the installed, already signed-in Codex CLI; it does not add an account or ask for an API key. The server runs `codex app-server --listen stdio://` from the temporary directory, sends `initialize`, `initialized` and `account/rateLimits/read`, then terminates the process. No thread, turn or generation is started. It has a twelve-second timeout and response-size bound.

Only validated percentages, reported window durations, reset timestamps and a check timestamp reach the UI. No auth files are read by Groot, and no raw account payload is returned. Window names come from actual durations: 300 minutes is five hours; 10,080 minutes is weekly. Missing data is unavailable rather than zero. Refresh is explicit; successful reads are shared/cached for sixty seconds in server memory. A failed refresh keeps the previous check labeled as such. A full page reload clears the displayed personal information.

Codex must be on the local server's PATH. Where needed, set the server-only `GROOT_CODEX_EXECUTABLE` environment variable to its executable path and restart Groot. This is an executable path, not a shell command; wrappers requiring a shell are not supported. Sign in through Codex itself before retrying. The CLI account may differ from an account active in another coding tool.

The public Vercel site cannot read the visitor's local Codex account. It offers local installation instead and never requests or snapshots allowance data. No runtime account data may be committed or included by `build:public`.

Reference: [official Codex app-server account rate limits](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt).

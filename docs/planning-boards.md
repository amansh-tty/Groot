# Planning boards

Home is the project browser. Create a project, then choose **Planning board**, or use **New board** in the project's Overview. Multiple boards can live in one project. Existing projects and imported prototypes are never moved or rewritten.

Each board is an ordinary `boards/<id>.json` file inside its selected project. Additional managed projects live at `workspace/projects/<project-id>/`; the original `workspace/` remains its own project. NOVA's root example is separate and rejects board/document/settings creation.

## Working with an external coding agent

Open the correct project folder in your agent. Read its context and the selected board before creating a prototype. Save any Groot edits first. The Agent handoff action explains the file to update. Groot does not launch or embed an agent.

```json
{
  "id": "board-example",
  "title": "Product plan",
  "nodes": [
    { "id": "goal", "x": 100, "y": 100, "text": "Goal: clarify the next step" },
    { "id": "assumption", "x": 460, "y": 100, "text": "Assumption: fewer choices help" }
  ],
  "edges": [{ "id": "goal-to-assumption", "from": "goal", "to": "assumption" }]
}
```

Keep IDs stable and the board ID equal to its filename. IDs use lowercase letters, digits and hyphens, up to eighty characters. Unknown fields and executable content are not supported. Text is displayed as plain text, including anything resembling HTML. The stored canvas is 4000×3000, with fixed 260×160 cards. Card x coordinates are 0–3740 and y coordinates are 0–2840. Limits: sixty cards, 2,000 characters per card, 120 directed connections, 100 boards per project, and 128 KB per board. Edges require existing, different cards; card and edge IDs must be unique. Label assumptions and verified project information distinctly in the text. Do not invent user research.

Boards are explicit agent input. Existing MCP context briefs still read their established project context sources; Groot does not automatically put every board into every agent prompt.

## Editing and recovery

- Drag card headers, or focus a header and use arrow keys to move by 8px; Shift moves by 32px.
- Connect cards by selecting Connect, then the first and second card. Remove individual edges through Connections, or undo the change.
- Pan with the Hand tool on the background, or focus the canvas and use arrow keys. Zoom and pan do not change the document.
- Save explicitly. Groot writes the validated JSON with an optimistic content revision; stale saves preserve the local draft. Undo retains up to forty local snapshots.
- A clean board refreshes saved external edits every four seconds. Invalid files remain on disk and produce an error. Groot does not replace them with an empty board.
- Leaving or reloading a dirty board offers Keep editing and Discard changes. Refreshing the browser also uses the existing unsaved-change guard.

The public Vercel build lists only bundled projects. Creating a project or board guides local installation; no visitor boards, prompts, repository settings or account limits are published. The board is a working local planning surface, not a vector illustration engine, slide editor or multiplayer service.

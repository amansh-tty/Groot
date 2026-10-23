import { useState } from 'react';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';

export function LocalSetup({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState('');
  const skill = location.origin + '/setup/SKILL.md';
  const prompt = `Help me set up Groot for my own local project. Read ${skill} and follow its setup workflow. Ask for my project folder, product name and coding agent. Check Node 24.19+ (24.x) and pnpm 11.19.0, install/build the repository in a separate folder, create or inspect my workspace without overwriting existing files, run the project setup command, and help configure its local MCP server and project skill. Ask the project-specific context questions, save my confirmed answers with their sources, and verify a context tool call and the local preview. Explain any manual trust/restart step I must complete. Do not use the public demo as storage for my project.`;
  return (
    <Dialog title="Use Groot with your project" onClose={onClose}>
      <p className="dialog-intro">
        This link runs the bundled demo. Your own project runs locally, alongside your coding agent.
      </p>
      <ol className="setup-steps">
        <li>
          <strong>Install the local app</strong>
          <p>Your agent checks the runtime, clones Groot into its own folder, and builds it.</p>
        </li>
        <li>
          <strong>Connect your project</strong>
          <p>
            Choose a separate workspace. Setup prepares the project skill and local MCP
            configuration without replacing your files.
          </p>
        </li>
        <li>
          <strong>Give it your context</strong>
          <p>
            Your agent asks relevant questions and saves your answers locally. Each prototype starts
            with a brief drawn from that context.
          </p>
        </li>
      </ol>
      <div className="setup-actions">
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              setNotice('Copied. Paste this into your coding agent.');
            } catch {
              setNotice('Copy unavailable. Open the setup brief below and copy it manually.');
            }
          }}
        >
          <Copy />
          Copy setup prompt
        </Button>
        <a
          href="https://github.com/amansh-tty/Groot/tree/groot-public-demo-context-mcp"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={14} />
          View repository
        </a>
      </div>
      <p role="status" className="setup-notice">
        {notice}
      </p>
      <details className="setup-details">
        <summary>Manual steps and setup brief</summary>
        <p>Node 24.19+ within 24.x · pnpm 11.19.0</p>
        <pre>{`git clone --branch groot-public-demo-context-mcp https://github.com/amansh-tty/Groot.git groot-app
cd groot-app
pnpm install --frozen-lockfile
pnpm build
pnpm groot create ../my-project --name "My project"
pnpm groot setup ../my-project
pnpm groot open ../my-project`}</pre>
        <p>
          Enable the generated MCP command in your coding agent, then follow the project skill. Your
          client may need a trust confirmation or restart.
        </p>
        <a href="/setup/SKILL.md" target="_blank" rel="noreferrer">
          <Download size={14} />
          Open setup skill
        </a>
        <pre>{prompt}</pre>
      </details>
      <p className="context-help">
        No account, API key, or embedded agent. The public demo cannot read your local files.
      </p>
    </Dialog>
  );
}

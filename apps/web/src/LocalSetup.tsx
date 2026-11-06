import { useState } from 'react';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';

export function LocalSetup({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState('');
  const [os, setOs] = useState(() =>
    /Windows/i.test(navigator.userAgent)
      ? 'windows'
      : /Macintosh|Mac OS X/i.test(navigator.userAgent)
        ? 'macos'
        : 'linux',
  );
  const [client, setClient] = useState('codex');
  const osName = os === 'windows' ? 'Windows' : os === 'macos' ? 'macOS' : 'Linux';
  const clientName =
    client === 'codex'
      ? 'Codex'
      : client === 'claude'
        ? 'Claude Code'
        : 'a compatible local MCP client';
  const clientHelp =
    client === 'codex'
      ? 'Add the generated command and arguments to Codex’s MCP configuration. Trust the project if required, then verify a context tool call.'
      : client === 'claude'
        ? 'Merge the generated server into Claude Code’s project MCP configuration. Approve the project server, then verify a context tool call.'
        : 'Use a client that supports local stdio MCP servers. Project-context tools work through MCP; editing prototypes also requires your agent to have local file access.';
  const connectionHelp =
    client === 'codex'
      ? 'Setup gives Codex access to your selected project’s context. Complete any project-trust step Codex asks for.'
      : client === 'claude'
        ? 'Setup connects Claude Code to your selected project while preserving your other connections. Approve the project server if Claude asks.'
        : 'Choose a client that supports local MCP connections. To build prototypes, your agent also needs permission to edit this project’s files.';
  const pm = os === 'windows' ? 'pnpm.cmd' : 'pnpm';
  const npm = os === 'windows' ? 'npm.cmd' : 'npm';
  const skill = location.origin + '/setup/SKILL.md';
  const prompt = `Help me set up Groot locally on ${osName} with ${clientName}. Read ${skill} and follow its setup workflow. Confirm my actual OS, project folder, product name and installed coding client. Check Git, Node 24.19+ (24.x) and pnpm 11.19.0; guide missing prerequisites through official OS-specific installation and required user approvals. Clone the current main branch of https://github.com/amansh-tty/Groot.git into a separate app folder, install/build it, and preserve existing projects. Run the project setup command to generate the local MCP launch configuration and project skill. ${clientHelp} Preserve other MCP servers and existing client settings. Do not mark the client connected merely because configuration was written: call get_project_context through the chosen client. Explain any manual trust/restart step. Ask the project-specific context questions, save my confirmed answers with their sources, and call get_prototype_brief. Start the local preview and verify it. Do not add embedded chat, API keys or a provider account to Groot. The public website is not my local MCP endpoint. Report any unverified step instead of claiming setup is complete.`;
  return (
    <Dialog title="Use Groot with your project" onClose={onClose}>
      <p className="dialog-intro">
        Run Groot on your computer and connect the coding agent you already use.
      </p>
      <div className="setup-choices">
        <label>
          Computer OS
          <select
            aria-label="Computer OS"
            value={os}
            onChange={(event) => {
              setOs(event.target.value);
              setNotice('');
            }}
          >
            <option value="windows">Windows</option>
            <option value="macos">macOS</option>
            <option value="linux">Linux</option>
          </select>
        </label>
        <label>
          Your agent
          <select
            aria-label="Your agent"
            value={client}
            onChange={(event) => {
              setClient(event.target.value);
              setNotice('');
            }}
          >
            <option value="codex">Codex</option>
            <option value="claude">Claude Code</option>
            <option value="other">Other local MCP client</option>
          </select>
        </label>
      </div>
      <ol className="setup-steps">
        <li>
          <strong>Install Groot locally</strong>
          <p>
            Your agent checks {osName} prerequisites, helps install missing tools, and builds Groot
            in a separate folder.
          </p>
        </li>
        <li>
          <strong>Connect your agent and project</strong>
          <p>{connectionHelp} Your existing project files stay in place.</p>
        </li>
        <li>
          <strong>Verify the connection, then open Groot</strong>
          <p>
            Your agent tests the connection, saves your confirmed project answers, and opens a
            working local preview. If a step needs your help, setup explains what remains.
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
        <a href="https://github.com/amansh-tty/Groot" target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          View repository
        </a>
      </div>
      <p role="status" className="setup-notice">
        {notice}
      </p>
      <details className="setup-details">
        <summary>Manual steps and setup brief</summary>
        <p>
          {osName} · {os === 'windows' ? 'PowerShell' : 'Terminal'} · Node 24.19+ within 24.x · pnpm
          11.19.0
        </p>
        <p>
          If Git or Node is missing, complete their OS-specific installation first. Only use create
          for a new project folder; use your existing workspace path otherwise.
        </p>
        <pre>{`git --version
node --version
${npm} install --global pnpm@11.19.0
git clone --branch main https://github.com/amansh-tty/Groot.git groot-app
cd groot-app
${pm} install --frozen-lockfile
${pm} build
${pm} groot create ../my-project --name "My project"
${pm} groot setup ../my-project
${pm} groot open ../my-project`}</pre>
        <p>
          Enable the generated MCP command in your coding agent, then follow the project skill. Your
          client may need a trust confirmation or restart.
        </p>
        <a href="/setup/SKILL.md" target="_blank" rel="noreferrer">
          <Download size={14} />
          Open setup skill
        </a>
        <pre aria-label="Local setup prompt">{prompt}</pre>
      </details>
      <p className="context-help">
        Groot adds no account, API key or embedded chat. Your coding agent keeps its own sign-in.
        The public demo cannot read local files.
      </p>
    </Dialog>
  );
}

import { realpath, readFile, stat } from 'node:fs/promises';
import { join, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { build } from 'esbuild';
import { installFeedbackBridge } from './feedback-bridge.js';

/** One compiler for local preview and portable export. Never evaluates prototype modules in Node. */
export async function compilePrototype(directory: string, demoDirectory: string, portable = false) {
  const root = await realpath(directory);
  async function safe(path: string) {
    const actual = await realpath(path);
    const rel = relative(root, actual);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path is outside the workspace.');
    return actual;
  }
  const demoPath = await safe(demoDirectory);
  let entry = join(demoPath, 'src/App.tsx');
  try {
    await safe(entry);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    entry = join(demoPath, 'src/App.jsx');
    await safe(entry);
  }
  let configImport = 'const config = {};';
  try {
    const configPath = await safe(join(demoPath, 'prototype.config.ts'));
    configImport = 'import config from ' + JSON.stringify(configPath.replaceAll('\\', '/')) + ';';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    /* optional contract */
  }
  let designSystemDirectory = join(root, 'packages/design-system');
  try {
    await safe(join(root, 'design-system/src/index.tsx'));
    designSystemDirectory = join(root, 'design-system');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    /* Existing workspaces use packages/design-system. */
  }
  const code = `import React, {useState, Component} from 'react';
import {createRoot} from 'react-dom/client';
import Prototype from ${JSON.stringify(entry.replaceAll('\\', '/'))};
${configImport}
const send = (data) => parent.postMessage({channel:'playground-preview', ...data}, '*');
window.addEventListener('error', event => send({type:'error', message:event.message}));
window.addEventListener('unhandledrejection', event => send({type:'error', message:String(event.reason)}));
class Boundary extends Component {
state = {error:null};
static getDerivedStateFromError(error) { return {error:String(error)}; }
componentDidCatch(error) { send({type:'error', message:String(error)}); }
render() { return this.state.error ? <pre role="alert">{this.state.error}</pre> : this.props.children; }
}
function Host() {
const [selection,setSelection]=useState({screen:'',state:'default'});
const [controls,setControls]=useState(Object.fromEntries((config.controls?.controls||[]).map(c=>[c.id,c.value])));
React.useEffect(()=>{const listener=(event)=>{if(event.source!==parent||event.data?.channel!=='playground-host'||event.data.type!=='controls')return;const values=event.data.values;setControls(current=>Object.fromEntries((config.controls?.controls||[]).map(c=>[c.id,typeof values?.[c.id]==='number'&&Number.isFinite(values[c.id])&&values[c.id]>=c.min&&values[c.id]<=c.max?values[c.id]:current[c.id]])));};window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);},[]);
React.useEffect(()=>{const listener=(event)=>{ if(event.source === parent && event.data?.channel==='playground-host' && event.data.type==='select') setSelection({screen:String(event.data.screen||''),state:String(event.data.state||'default')});};window.addEventListener('message',listener);send({type:'ready',config});return()=>window.removeEventListener('message',listener);},[]);
return <Boundary key={selection.screen+selection.state}><Prototype {...selection} controls={controls}/></Boundary>;
}
createRoot(document.getElementById('root')).render(<Host/>);`;
  const compilerRoot = fileURLToPath(new URL('../../../', import.meta.url));
  const webModules = join(compilerRoot, 'apps/web/node_modules');
  const output = await build({
    stdin: {
      // tsx development output may annotate nested function names with __name.
      contents:
        code + '\n((__name) => { (' + installFeedbackBridge.toString() + ')(); })((fn) => fn);',
      loader: 'tsx',
      resolveDir: root,
      sourcefile: 'preview-host.tsx',
    },
    absWorkingDir: root,
    bundle: true,
    loader: {
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.gif': 'dataurl',
      '.webp': 'dataurl',
      '.svg': 'dataurl',
    },
    write: false,
    outdir: 'preview-output',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    alias: {
      react: join(webModules, 'react'),
      'react-dom': join(webModules, 'react-dom'),
      'lucide-react': join(webModules, 'lucide-react'),
      '@playground/design-system': join(designSystemDirectory, 'src/index.tsx'),
    },
    plugins: [
      {
        name: 'workspace-boundary',
        setup: (builder) => {
          builder.onLoad({ filter: /.*/ }, async (args) => {
            const actual = await realpath(args.path);
            const allowed = [
              demoPath,
              join(root, 'data'),
              designSystemDirectory,
              join(compilerRoot, 'node_modules'),
            ];
            if (
              !allowed.some((base) => {
                const rel = relative(base, actual);
                return !rel.startsWith('..') && !isAbsolute(rel);
              })
            ) {
              return {
                errors: [
                  {
                    text:
                      'Import is outside this demo, shared data or design system: ' +
                      relative(root, actual),
                  },
                ],
              };
            }
            if (portable && !actual.includes('node_modules')) {
              if ((await stat(actual)).size > 5_000_000)
                throw new Error('Portable input exceeds 5 MB: ' + relative(root, actual));
              if (/\.[cm]?[jt]sx?$/.test(actual)) {
                const source = await readFile(actual, 'utf8');
                if (
                  /\b(?:src|poster)\s*=\s*(?:["'][^"']+["']|\{\s*["'][^"']+["']\s*\})/.test(source)
                ) {
                  throw new Error(
                    'Portable export requires imported images (src={image}), not literal image URLs: ' +
                      relative(root, actual),
                  );
                }
              }
              if (extname(actual) === '.svg') {
                const svg = await readFile(actual, 'utf8');
                if (
                  /<script\b|\b(?:href|xlink:href)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i.test(svg)
                ) {
                  throw new Error(
                    'Portable SVG must not contain scripts or external references: ' +
                      relative(root, actual),
                  );
                }
              }
            }
            return undefined;
          });
        },
      },
    ],
  });
  const js = output.outputFiles.find((file) => file.path.endsWith('.js'))?.text ?? '';
  const css = output.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
  if (!js) throw new Error('Compiler did not emit prototype JavaScript.');
  if (portable && /(?:url\(\s*["']?(?!data:|#)[^\s)"']|@import\s)/i.test(css)) {
    throw new Error(
      'Portable CSS contains an external asset or import. Use an imported local image; remote URLs and fonts are unsupported.',
    );
  }
  const nonce = randomUUID().replaceAll('-', '');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>html,body{margin:0}${css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script nonce="${nonce}">${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
  return {
    html,
    fingerprint: createHash('sha256')
      .update(js + css)
      .digest('hex'),
  };
}

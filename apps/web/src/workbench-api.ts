import type { DemoMeta, Feedback } from '@playground/shared';
export type Demo = DemoMeta & { modified: string };
export interface Catalog {
  demos: Demo[];
  warnings: string[];
  revision: number;
  designer: { name: string; slug: string };
}
export interface Detail {
  meta: DemoMeta;
  readme: string;
  prompts?: { prompt: string; createdAt: string }[];
  promptError?: string;
  feedback: Feedback[];
}
export const publicDemo = import.meta.env.MODE === 'public-demo';
export function requestLocalSetup() {
  window.dispatchEvent(new Event('groot:local-setup'));
}
export function apiUrl(path: string) {
  const example = new URLSearchParams(location.search).get('example') === 'nova';
  if (publicDemo) {
    const route = path.split('?')[0]!;
    if (
      !/^\/(?:workspace|context|project-context|demos(?:\/[a-z0-9][a-z0-9-]{0,79}(?:\/(?:frame|preview|feedback|controls))?)?)$/.test(
        route,
      )
    )
      throw new Error('This operation is unavailable in the public demo.');
    return (
      '/demo-data/' +
      (example ? 'example' : 'user') +
      route +
      (route.endsWith('/frame') ? '.html' : '.json')
    );
  }
  return (
    '/api' + path + (path.includes('?') ? '&' : '?') + 'scope=' + (example ? 'example' : 'user')
  );
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  if (publicDemo && options?.method && options.method !== 'GET') {
    requestLocalSetup();
    throw new Error('Install Groot locally to save changes to your project.');
  }
  const response = await fetch(apiUrl(path), { ...options, signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error?.message ??
        'The local workspace is unavailable. Check that pnpm dev is running.',
    );
  return result as T;
}

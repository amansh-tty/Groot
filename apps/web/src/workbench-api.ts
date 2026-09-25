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
  feedback: Feedback[];
}
export function apiUrl(path: string) {
  const example = new URLSearchParams(location.search).get('example') === 'nova';
  return (
    '/api' + path + (path.includes('?') ? '&' : '?') + 'scope=' + (example ? 'example' : 'user')
  );
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), { ...options, signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error?.message ??
        'The local workspace is unavailable. Check that pnpm dev is running.',
    );
  return result as T;
}

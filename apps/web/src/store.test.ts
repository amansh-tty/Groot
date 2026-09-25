import { afterEach, expect, it, vi } from 'vitest';
import { useAppStore } from './store';

afterEach(() => {
  vi.unstubAllGlobals();
  useAppStore.setState({
    health: null,
    settings: { accent: 'neutral' },
    loading: true,
    saving: false,
    error: null,
    saved: false,
  });
});

it('shows connection failure instead of manufacturing successful health', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
  await useAppStore.getState().load();
  expect(useAppStore.getState().health).toBeNull();
  expect(useAppStore.getState().error).toContain('Cannot reach');
});

it('preserves saved settings when a subsequent save fails', async () => {
  useAppStore.setState({
    loading: false,
    settings: { accent: 'sage' },
    health: {
      status: 'ok',
      version: '0.0.1',
      phase: 'workbench',
      database: { status: 'ready', schemaVersion: 1 },
      ai: 'external-agent',
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Disk full.' } }), {
        status: 500,
      }),
    ),
  );
  await useAppStore.getState().saveAccent('blue');
  expect(useAppStore.getState().settings.accent).toBe('sage');
  expect(useAppStore.getState().saved).toBe(false);
  expect(useAppStore.getState().error).toBe('Disk full.');
});

import { create } from 'zustand';
import {
  apiErrorSchema,
  defaultSettings,
  healthSchema,
  settingsSchema,
  type Health,
  type Settings,
} from '@playground/shared';

async function request(path: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { ...options, signal: AbortSignal.timeout(8000) });
  const data: unknown = await response.json();
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(data);
    throw new Error(
      parsed.success
        ? parsed.data.error.message
        : 'The local server could not complete this request.',
    );
  }
  return data;
}

function message(error: unknown): string {
  return error instanceof Error &&
    !['TypeError', 'SyntaxError', 'TimeoutError'].includes(error.name)
    ? error.message
    : 'Cannot reach your local server. Keep pnpm dev or pnpm start running, then retry.';
}

interface AppState {
  health: Health | null;
  settings: Settings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
  load: () => Promise<void>;
  saveAccent: (accent: Settings['accent']) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  health: null,
  settings: defaultSettings,
  loading: true,
  saving: false,
  error: null,
  saved: false,
  load: async () => {
    set({ loading: true, error: null, saved: false });
    try {
      const [health, settings] = await Promise.all([
        request('/api/health'),
        request('/api/settings'),
      ]);
      set({
        health: healthSchema.parse(health),
        settings: settingsSchema.parse(settings),
        loading: false,
      });
    } catch (error) {
      set({ health: null, error: message(error), loading: false });
    }
  },
  saveAccent: async (accent) => {
    if (get().saving || get().loading || !get().health) return;
    const previous = get().settings;
    set({ settings: { accent }, saving: true, error: null, saved: false });
    try {
      const settings = settingsSchema.parse(
        await request('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accent }),
        }),
      );
      set({ settings, saving: false, saved: true });
    } catch (error) {
      set({ settings: previous, saving: false, error: message(error) });
    }
  },
}));

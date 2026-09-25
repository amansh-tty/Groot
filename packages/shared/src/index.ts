import { z } from 'zod';

export const appearanceSchema = z.enum(['neutral', 'sage', 'blue']);
export const settingsSchema = z.object({ accent: appearanceSchema }).strict();
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings: Settings = { accent: 'neutral' };

export const healthSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  phase: z.literal('workbench'),
  database: z.object({ status: z.literal('ready'), schemaVersion: z.number().int().positive() }),
  ai: z.literal('external-agent'),
});
export type Health = z.infer<typeof healthSchema>;

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

// Context provenance is explicit at the boundary; assumptions cannot masquerade as facts.
export const contextEntrySchema = z.object({
  kind: z.enum(['fact', 'decision', 'assumption', 'proposal']),
  text: z.string().trim().min(1).max(8000),
});
export type ContextEntry = z.infer<typeof contextEntrySchema>;

export const demoMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
  title: z.string().trim().min(1).max(100),
  description: z.string().max(500).default(''),
  rationale: z.string().max(2000).default(''),
  platform: z.enum(['web', 'mobile']),
  author: z.string().max(80).default('Unknown'),
  authorSlug: z.string().max(80).optional(),
  tags: z.array(z.string().max(40)).max(12).default([]),
  parentId: z.string().nullable().default(null),
});
export type DemoMeta = z.infer<typeof demoMetaSchema>;
export const designerSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});
export const elementContextSchema = z.object({
  element: z.string().max(500),
  elementId: z.string().max(160).default(''),
  component: z.string().max(80).default(''),
  label: z.string().max(200).default(''),
  selector: z.string().max(1000).default(''),
  screen: z.string().max(100),
  state: z.string().max(100).default('default'),
});
export const feedbackItemSchema = elementContextSchema.extend({
  id: z.string().max(100),
  prototype: z.string().max(80),
  comment: z.string().trim().min(1).max(4000),
  status: z.enum(['open', 'resolved']),
  createdAt: z.string().default(''),
  resolvedAt: z.string().nullable().default(null),
});
export const feedbackSchema = z.array(feedbackItemSchema).max(500);
export type Feedback = z.infer<typeof feedbackItemSchema>;
export type ElementContext = z.infer<typeof elementContextSchema>;
export const feedbackActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    target: elementContextSchema,
    comment: z.string().trim().min(1).max(4000),
  }),
  z.object({
    action: z.literal('edit'),
    id: z.string(),
    comment: z.string().trim().min(1).max(4000),
  }),
  z.object({ action: z.literal('status'), id: z.string(), status: z.enum(['open', 'resolved']) }),
  z.object({ action: z.literal('delete'), id: z.string() }),
]);
export type FeedbackAction = z.infer<typeof feedbackActionSchema>;
export const controlSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,60}$/),
    label: z.string().min(1).max(80),
    type: z.enum(['number', 'slider']),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite(),
    value: z.number().finite(),
    unit: z.enum(['px', 'ms', '']).default(''),
  })
  .refine(
    (c) =>
      c.min <= c.max &&
      c.value >= c.min &&
      c.value <= c.max &&
      Math.abs((c.value - c.min) / c.step - Math.round((c.value - c.min) / c.step)) < 0.000001,
    'Control value must match its declared range and step.',
  );
export const controlsSchema = z
  .object({
    area: z.string().min(1).max(100),
    screen: z.string().max(100),
    controls: z.array(controlSchema).min(1).max(12),
  })
  .refine(
    (c) => new Set(c.controls.map((x) => x.id)).size === c.controls.length,
    'Control IDs must be unique.',
  );
export type Controls = z.infer<typeof controlsSchema>;
export const prototypeConfigSchema = z.object({
  controls: controlsSchema.optional(),
  screens: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .max(20)
    .default([]),
  states: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .max(20)
    .default([]),
  viewport: z.enum(['desktop', 'mobile']).default('desktop'),
});
export type PrototypeConfig = z.infer<typeof prototypeConfigSchema>;
export interface PrototypeProps {
  screen: string;
  state: string;
  controls?: Record<string, number>;
}

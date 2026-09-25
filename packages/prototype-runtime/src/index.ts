/** Historical policy constants. The V1 preview implementation is apps/server/src/workbench.ts. */
export const previewPolicy = Object.freeze({
  sandbox: 'allow-scripts',
  dependencies: ['react', 'react-dom', 'lucide-react'] as const,
  viewports: { desktop: 1280, tablet: 768, mobile: 390 },
});

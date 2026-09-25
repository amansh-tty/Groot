import type { Catalog } from './workbench-api';
export function explorationFamily(catalog: Catalog, id: string) {
  let root = id;
  const seen = new Set<string>();
  while (!seen.has(root)) {
    seen.add(root);
    const parent = catalog.demos.find((d) => d.id === root)?.parentId;
    if (!parent || !catalog.demos.some((d) => d.id === parent)) break;
    root = parent;
  }
  const result: { id: string; title: string; depth: number }[] = [];
  const visited = new Set<string>();
  function visit(current: string, depth: number) {
    if (visited.has(current)) return;
    visited.add(current);
    const demo = catalog.demos.find((d) => d.id === current);
    if (!demo) return;
    result.push({ id: current, title: demo.title, depth });
    catalog.demos.filter((d) => d.parentId === current).forEach((d) => visit(d.id, depth + 1));
  }
  visit(root, 0);
  return result;
}
export function ExplorationTree({
  catalog,
  id,
  onOpen,
}: {
  catalog: Catalog;
  id: string;
  onOpen: (id: string) => void;
}) {
  return (
    <nav className="inspector-section exploration-tree" aria-label="Related explorations">
      <h2>Explorations</h2>
      {explorationFamily(catalog, id).map((d) => (
        <button
          key={d.id}
          aria-current={d.id === id ? 'page' : undefined}
          onClick={() => onOpen(d.id)}
          style={{ paddingLeft: 8 + Math.min(d.depth, 6) * 12 }}
        >
          <span aria-hidden="true">{d.depth ? '↳' : '●'}</span> {d.title}
          {d.id === id && <small>Active</small>}
        </button>
      ))}
    </nav>
  );
}

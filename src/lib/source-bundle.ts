const srcFiles = import.meta.glob(
  ['/src/**/*.{ts,tsx,css}'],
  { query: '?raw', import: 'default', eager: true }
);

const publicFiles = import.meta.glob(
  ['/public/*.{json,js}'],
  { query: '?raw', import: 'default', eager: true }
);

const rootFiles = import.meta.glob(
  ['/index.html', '/package.json', '/vite.config.ts', '/tsconfig.json',
   '/firebase.json', '/firestore.rules', '/firestore.indexes.json', '/components.json'],
  { query: '?raw', import: 'default', eager: true }
);

const functionsFiles = import.meta.glob(
  ['/functions/**/*.{ts,json}'],
  { query: '?raw', import: 'default', eager: true }
);

export function getSourceFiles(): Record<string, string> {
  const all = { ...srcFiles, ...publicFiles, ...rootFiles, ...functionsFiles };
  const result: Record<string, string> = {};
  for (const [path, content] of Object.entries(all)) {
    result[path.replace(/^\//, '')] = content as string;
  }
  return result;
}

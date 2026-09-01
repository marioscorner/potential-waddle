import { getAllContent, getUploads } from '../../../server/db/queries.js';
import defaultContent from '../../../server/routes/defaultContent.js';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// Defaults keep public rendering compatible when an editable section is not stored yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeDefaults = (defaults: unknown, content: unknown): any => {
  if (!isPlainObject(defaults) || !isPlainObject(content)) return content ?? defaults;

  return Object.entries({ ...defaults, ...content }).reduce<Record<string, unknown>>((merged, [key, value]) => {
    merged[key] = mergeDefaults(defaults[key], value);
    return merged;
  }, {});
};

export const getPortfolioData = async () => {
  const [storedContent, uploads] = await Promise.all([
    getAllContent().catch((error) => {
      console.warn('Using default content because PostgreSQL is unavailable:', error.message);
      return {};
    }),
    getUploads().catch((error) => {
      console.warn('Using bundled assets because uploads are unavailable:', error.message);
      return [];
    }),
  ]);

  return {
    content: mergeDefaults(defaultContent, storedContent),
    uploads: Array.isArray(uploads) ? uploads : [],
  };
};

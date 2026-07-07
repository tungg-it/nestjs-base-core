export const convertToCamelCase = (str: string): string => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (m) => m.toLowerCase());
};

export const toNumber = (value: unknown): unknown =>
  typeof value === 'string' || typeof value === 'number' ? Number(value) : value;

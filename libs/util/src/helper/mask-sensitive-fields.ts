const SENSITIVE_FIELD =
  /(authorization|cookie|credential|password|passphrase|secret|token|api[-_]?key|private[-_]?key)/i;

/** Returns a log-safe copy without mutating the original value. */
export function maskSensitiveFields(value: unknown): unknown {
  return maskValue(value, new WeakSet<object>());
}

function maskValue(value: unknown, ancestors: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || value instanceof RegExp || Buffer.isBuffer(value)) {
    return value;
  }
  if (ancestors.has(value)) return '[Circular]';

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => maskValue(item, ancestors));
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        SENSITIVE_FIELD.test(key) ? '[Redacted]' : maskValue(child, ancestors),
      ]),
    );
  } finally {
    ancestors.delete(value);
  }
}

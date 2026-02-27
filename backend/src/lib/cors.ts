type OriginMatchRule = string | RegExp;

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://secondsy.netlify.app',
];

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toOriginRule = (rawOrigin: string): OriginMatchRule => {
  const normalized = rawOrigin.trim();

  if (normalized.includes('*')) {
    const wildcardPattern = `^${normalized
      .split('*')
      .map((segment) => escapeRegex(segment))
      .join('.*')}$`;
    return new RegExp(wildcardPattern);
  }

  return normalized;
};

const isOriginAllowed = (origin: string, rules: OriginMatchRule[]) =>
  rules.some((rule) =>
    typeof rule === 'string' ? rule === origin : rule.test(origin),
  );

const readCorsRules = () => {
  const rawCorsOrigin = process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGINS.join(',');

  const rules = rawCorsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => toOriginRule(origin));

  return rules.length > 0 ? rules : DEFAULT_CORS_ORIGINS.map((origin) => toOriginRule(origin));
};

export const corsOriginResolver = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  const rules = readCorsRules();

  if (isOriginAllowed(origin, rules)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

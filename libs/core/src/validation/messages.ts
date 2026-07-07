import { I18nContext } from 'nestjs-i18n';

/** class-validator constraint name → i18n key under `validation.json`. */
export const CONSTRAINT_I18N_KEYS: Record<string, string> = {
  isNotEmpty: 'validation.constraints.isNotEmpty',
  isString: 'validation.constraints.isString',
  isInt: 'validation.constraints.isInt',
  isNumber: 'validation.constraints.isNumber',
  isBoolean: 'validation.constraints.isBoolean',
  isArray: 'validation.constraints.isArray',
  isEnum: 'validation.constraints.isEnum',
  isUuidV7: 'validation.constraints.isUuidV7',
  isUnixTimestamp: 'validation.constraints.isUnixTimestamp',
  maxLength: 'validation.constraints.maxLength',
  minLength: 'validation.constraints.minLength',
  max: 'validation.constraints.max',
  min: 'validation.constraints.min',
  arrayNotEmpty: 'validation.constraints.arrayNotEmpty',
  isDateString: 'validation.constraints.isDateString',
};

export const resolveValidationMessage = (constraintKey: string, field: string): string | undefined => {
  const i18nKey = CONSTRAINT_I18N_KEYS[constraintKey];
  if (!i18nKey) return undefined;

  const i18n = I18nContext.current();
  if (!i18n) return undefined;

  const translated = i18n.t(i18nKey, {
    args: { property: field },
  });
  return translated && translated !== i18nKey ? (translated as string) : undefined;
};

import { useState, useCallback } from "react";

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], allValues: T) => string | null;
};

interface UseFormValidationResult<T> {
  errors: Partial<Record<keyof T, string>>;
  validate: (values: T) => boolean;
  clearError: (field: keyof T) => void;
  isValid: boolean;
}

export function useFormValidation<T extends Record<string, unknown>>(
  rules: ValidationRules<T>
): UseFormValidationResult<T> {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback(
    (values: T): boolean => {
      const newErrors: Partial<Record<keyof T, string>> = {};
      let valid = true;

      for (const key of Object.keys(rules) as Array<keyof T>) {
        const rule = rules[key];
        if (rule) {
          const error = rule(values[key] as T[typeof key], values);
          if (error) {
            newErrors[key] = error;
            valid = false;
          }
        }
      }

      setErrors(newErrors);
      return valid;
    },
    [rules]
  );

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return { errors, validate, clearError, isValid };
}

/**
 * Shared validation logic for data and state.
 */

export const Validators = {
  isString: (val) => typeof val === "string",
  isNumber: (val) => typeof val === "number",
  isBoolean: (val) => typeof val === "boolean",
  isArray: (val) => Array.isArray(val),
  isType: (types) => (val) => types.includes(val),
};

/**
 * Validates an object against a schema.
 * @param {Object} obj The object to validate.
 * @param {Object} schema The schema to validate against.
 * @param {string} prefix Optional prefix for error messages.
 * @returns {string[]} List of error messages. Empty if valid.
 */
export function validateObject(obj, schema, prefix = "") {
  const errors = [];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    errors.push(`${prefix || "Root"} expected object, got ${typeof obj}`);
    return errors;
  }

  // Check required fields and custom rules
  for (const key in schema) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const rule = schema[key];
    const value = obj[key];

    if (rule === "required") {
      if (value === undefined) {
        errors.push(`Missing required field "${fieldPath}"`);
      }
    } else if (typeof rule === "function") {
      const result = rule(value, obj);
      if (Array.isArray(result)) {
        // Function returned detailed errors
        errors.push(
          ...result.map((err) => (prefix ? `${prefix}.${err}` : err)),
        );
      } else if (!result) {
        errors.push(
          `Invalid or missing value for "${fieldPath}": ${JSON.stringify(value)}`,
        );
      }
    } else if (Validators.isArray(rule)) {
      if (!Validators.isArray(value)) {
        errors.push(`"${fieldPath}" must be an array`);
      } else {
        const itemSchema = rule[0];
        value.forEach((item, index) => {
          const itemPath = `${fieldPath}[${index}]`;
          if (typeof itemSchema === "object") {
            errors.push(...validateObject(item, itemSchema, itemPath));
          } else if (typeof itemSchema === "function") {
            const result = itemSchema(item);
            if (Array.isArray(result)) {
              errors.push(...result.map((err) => `${itemPath}.${err}`));
            } else if (!result) {
              errors.push(`Invalid value at "${itemPath}"`);
            }
          }
        });
      }
    } else if (typeof rule === "object") {
      if (value === undefined) {
        errors.push(`Missing required object "${fieldPath}"`);
      } else {
        errors.push(...validateObject(value, rule, fieldPath));
      }
    }
  }

  // Check for unknown keys (only for non-array objects)
  if (!Array.isArray(obj)) {
    for (const key in obj) {
      if (!(key in schema)) {
        errors.push(`Unknown field "${prefix ? `${prefix}.${key}` : key}"`);
      }
    }
  }

  return errors;
}

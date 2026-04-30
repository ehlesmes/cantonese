import { describe, it, expect } from "vitest";
import { validateObject, Validators } from "./validator.js";

describe("Validator Engine", () => {
  describe("Basic Types", () => {
    const schema = {
      s: Validators.isString,
      n: Validators.isNumber,
      b: Validators.isBoolean,
    };

    it("should pass valid data", () => {
      const data = { s: "hello", n: 42, b: true };
      expect(validateObject(data, schema)).toEqual([]);
    });

    it("should catch invalid types", () => {
      const data = { s: 123, n: "42", b: "true" };
      const errors = validateObject(data, schema);
      expect(errors.length).toBe(3);
      expect(errors[0]).toContain('Invalid or missing value for "s"');
    });

    it("should catch missing required fields", () => {
      const data = { s: "hello" };
      const errors = validateObject(data, { ...schema, n: "required" });
      expect(errors).toContain('Missing required field "n"');
    });

    it("should catch unknown fields", () => {
      const data = { s: "hello", n: 1, b: true, extra: "field" };
      const errors = validateObject(data, schema);
      expect(errors).toContain('Unknown field "extra"');
    });

    it("should validate enum-like types with isType", () => {
      const schema = {
        type: Validators.isType(["A", "B"]),
      };
      expect(validateObject({ type: "A" }, schema)).toEqual([]);
      expect(validateObject({ type: "C" }, schema)).toContain(
        'Invalid or missing value for "type": "C"',
      );
    });
  });

  describe("Nested Objects", () => {
    const schema = {
      meta: {
        id: Validators.isString,
        tags: Validators.isArray,
      },
    };

    it("should validate deep objects", () => {
      const data = { meta: { id: "123", tags: [] } };
      expect(validateObject(data, schema)).toEqual([]);
    });

    it("should catch deep errors", () => {
      const data = { meta: { id: 123, tags: "none" } };
      const errors = validateObject(data, schema);
      expect(errors).toContain('Invalid or missing value for "meta.id": 123');
      expect(errors).toContain('Invalid or missing value for "meta.tags": "none"');
    });
  });

  describe("Arrays", () => {
    it("should validate array of objects", () => {
      const schema = {
        items: [{ id: Validators.isString }],
      };
      const data = { items: [{ id: "a" }, { id: "b" }] };
      expect(validateObject(data, schema)).toEqual([]);

      const invalid = { items: [{ id: 1 }] };
      expect(validateObject(invalid, schema)).toContain(
        'Invalid or missing value for "items[0].id": 1',
      );
    });

    it("should validate array of primitives", () => {
      const schema = {
        tags: [Validators.isString],
      };
      const data = { tags: ["a", "b"] };
      expect(validateObject(data, schema)).toEqual([]);

      const invalid = { tags: ["a", 1] };
      expect(validateObject(invalid, schema)).toContain('Invalid value at "tags[1]"');
    });
  });

  describe("Union Types (Function support)", () => {
    it("should support custom function validation", () => {
      // Note: In our implementation, returning a string is currently treated as falsey
      // but returning an array of strings is treated as detailed errors.
      // Let's test the array behavior we added.

      const unionSchema = {
        val: (v) => (v === 1 ? [] : ["Value must be 1"]),
      };

      expect(validateObject({ val: 1 }, unionSchema)).toEqual([]);
      expect(validateObject({ val: 2 }, unionSchema)).toEqual(["Value must be 1"]);
    });

    it("should handle deep union errors via array return", () => {
      const itemSchema = { type: Validators.isString };
      const schema = {
        pages: [(item) => (item.type === "valid" ? [] : validateObject(item, itemSchema))],
      };

      const data = { pages: [{ type: "valid" }, { type: 123 }] };
      const errors = validateObject(data, schema);
      expect(errors).toContain('pages[1].Invalid or missing value for "type": 123');
    });
  });
});

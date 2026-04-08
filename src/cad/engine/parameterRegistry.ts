// src/cad/engine/parameterRegistry.ts

import type { Parameter } from "./types";

/**
 * Creates a new parameter.
 */
export function createParameter(
  name: string,
  value: number,
  unit = "mm",
  expression: string | null = null
): Parameter {
  return { name, value, unit, expression };
}

/**
 * Sets a parameter value directly.
 */
export function setParameterValue(
  parameters: Record<string, Parameter>,
  name: string,
  value: number
): Record<string, Parameter> {
  const existing = parameters[name];
  if (!existing) throw new Error(`Parameter "${name}" not found`);
  return {
    ...parameters,
    [name]: { ...existing, value, expression: null },
  };
}

/**
 * Sets a parameter expression. The expression is evaluated immediately
 * and the resolved value is stored.
 */
export function setParameterExpression(
  parameters: Record<string, Parameter>,
  name: string,
  expression: string
): Record<string, Parameter> {
  const existing = parameters[name];
  if (!existing) throw new Error(`Parameter "${name}" not found`);
  const value = evaluateExpression(expression, parameters);
  return {
    ...parameters,
    [name]: { ...existing, value, expression },
  };
}

/**
 * Adds a new parameter.
 */
export function addParameter(
  parameters: Record<string, Parameter>,
  param: Parameter
): Record<string, Parameter> {
  if (parameters[param.name]) {
    throw new Error(`Parameter "${param.name}" already exists`);
  }
  return { ...parameters, [param.name]: param };
}

/**
 * Removes a parameter by name.
 */
export function removeParameter(
  parameters: Record<string, Parameter>,
  name: string
): Record<string, Parameter> {
  const { [name]: _, ...rest } = parameters;
  return rest;
}

/**
 * Evaluates all parameter expressions in dependency order.
 * Detects circular references.
 */
export function evaluateAll(
  parameters: Record<string, Parameter>
): Record<string, Parameter> {
  const result = { ...parameters };
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function resolve(name: string): number {
    if (visiting.has(name)) {
      throw new Error(`Circular parameter reference detected: ${name}`);
    }
    if (visited.has(name)) {
      return result[name].value;
    }

    visiting.add(name);
    const param = result[name];
    if (param.expression) {
      param.value = evaluateExpression(param.expression, result, resolve);
    }
    visiting.delete(name);
    visited.add(name);
    return param.value;
  }

  for (const name of Object.keys(result)) {
    resolve(name);
  }

  return result;
}

/**
 * Evaluates a simple math expression with parameter references.
 * Supports: +, -, *, /, (), unary minus, and parameter names.
 *
 * Uses a recursive-descent parser — no eval/Function, CSP-safe.
 */
export function evaluateExpression(
  expression: string,
  parameters: Record<string, Parameter>,
  resolveParam?: (name: string) => number
): number {
  // Replace parameter references with their values
  let expr = expression;
  // Sort by length descending to avoid partial matches
  const paramNames = Object.keys(parameters).sort(
    (a, b) => b.length - a.length
  );

  for (const name of paramNames) {
    const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, "g");
    if (regex.test(expr)) {
      const value = resolveParam
        ? resolveParam(name)
        : parameters[name].value;
      expr = expr.replace(regex, String(value));
    }
  }

  try {
    const result = parseExpression(expr.trim());
    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error(`Expression "${expression}" did not produce a valid number`);
    }
    return result;
  } catch (err: any) {
    throw new Error(`Failed to evaluate expression: ${expression} — ${err.message}`);
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursive-descent parser for arithmetic expressions.
 * Grammar:
 *   expr     → term (('+' | '-') term)*
 *   term     → unary (('*' | '/') unary)*
 *   unary    → ('-' unary) | primary
 *   primary  → NUMBER | '(' expr ')'
 */
function parseExpression(input: string): number {
  let pos = 0;

  function skipWhitespace() {
    while (pos < input.length && input[pos] === " ") pos++;
  }

  function parseExpr(): number {
    let left = parseTerm();
    skipWhitespace();
    while (pos < input.length && (input[pos] === "+" || input[pos] === "-")) {
      const op = input[pos++];
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
      skipWhitespace();
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseUnary();
    skipWhitespace();
    while (pos < input.length && (input[pos] === "*" || input[pos] === "/")) {
      const op = input[pos++];
      const right = parseUnary();
      left = op === "*" ? left * right : left / right;
      skipWhitespace();
    }
    return left;
  }

  function parseUnary(): number {
    skipWhitespace();
    if (pos < input.length && input[pos] === "-") {
      pos++;
      return -parseUnary();
    }
    if (pos < input.length && input[pos] === "+") {
      pos++;
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    skipWhitespace();
    if (pos < input.length && input[pos] === "(") {
      pos++; // skip '('
      const val = parseExpr();
      skipWhitespace();
      if (pos >= input.length || input[pos] !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      pos++; // skip ')'
      return val;
    }

    // Parse number (integer or decimal)
    const start = pos;
    while (pos < input.length && (isDigit(input[pos]) || input[pos] === ".")) {
      pos++;
    }
    if (pos === start) {
      throw new Error(`Unexpected character at position ${pos}: '${input[pos] ?? "EOF"}'`);
    }
    return parseFloat(input.slice(start, pos));
  }

  function isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  const result = parseExpr();
  skipWhitespace();
  if (pos !== input.length) {
    throw new Error(`Unexpected character at position ${pos}: '${input[pos]}'`);
  }
  return result;
}

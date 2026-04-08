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
 * Supports: +, -, *, /, (), and parameter names.
 *
 * This is a safe evaluator — no arbitrary code execution.
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

  // Validate: only allow numbers, operators, parens, whitespace, decimal points
  if (!/^[\d\s+\-*/().]+$/.test(expr)) {
    throw new Error(`Invalid expression: ${expression}`);
  }

  // Evaluate using Function (safe since we validated the content)
  try {
    const result = new Function(`return (${expr})`)();
    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error(`Expression "${expression}" did not produce a valid number`);
    }
    return result;
  } catch {
    throw new Error(`Failed to evaluate expression: ${expression}`);
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

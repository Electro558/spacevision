#!/usr/bin/env npx tsx
/**
 * Export composition recipes as fine-tuning JSONL
 *
 * Usage:
 *   npx tsx scripts/export-training-data.ts
 *
 * Output:
 *   training-data/finetune.jsonl — ready for OpenAI or Anthropic fine-tuning API
 *   training-data/recipes.json  — raw recipes for inspection
 *
 * To fine-tune with OpenAI:
 *   openai api fine_tunes.create -t training-data/finetune.jsonl -m gpt-4o-mini
 *
 * To fine-tune with Anthropic (when available):
 *   Upload finetune.jsonl via the Anthropic console
 */

import * as fs from "fs";
import * as path from "path";
import { RECIPES, exportFineTuningJSONL } from "../src/lib/training/compositionRecipes";

const OUTPUT_DIR = path.join(__dirname, "..", "training-data");

// Ensure output directory
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Base system prompt (simplified for fine-tuning — no scene state or few-shot needed)
const SYSTEM_PROMPT = `You are a 3D modeling assistant. Build 3D scenes by composing primitive shapes (box, sphere, cylinder, cone, torus, wedge, tube, star, roundedBox, pyramid, roof, arrow, ring, capsule, halfSphere).

Rules:
- y=0 is the ground plane. Objects rest on or above ground.
- Use realistic proportions. A door is 0.8 wide, 2.0 tall. A table is 0.75 tall.
- Name objects descriptively (e.g., "House Wall Left" not "Box 1").
- Use 5-15 primitives for detailed objects.
- Set appropriate materials: wood (roughness=0.8), metal (metalness=0.8, roughness=0.2), glass (opacity=0.5).`;

// Export JSONL for fine-tuning
const jsonl = exportFineTuningJSONL(SYSTEM_PROMPT);
fs.writeFileSync(path.join(OUTPUT_DIR, "finetune.jsonl"), jsonl);

// Export raw recipes as JSON for inspection
fs.writeFileSync(
  path.join(OUTPUT_DIR, "recipes.json"),
  JSON.stringify(RECIPES, null, 2)
);

// Summary stats
const categories = [...new Set(RECIPES.map(r => r.category))];
const byDifficulty = {
  simple: RECIPES.filter(r => r.difficulty === "simple").length,
  medium: RECIPES.filter(r => r.difficulty === "medium").length,
  complex: RECIPES.filter(r => r.difficulty === "complex").length,
};

console.log("Training data exported!");
console.log(`  Recipes: ${RECIPES.length}`);
console.log(`  Categories: ${categories.join(", ")}`);
console.log(`  Difficulty: ${byDifficulty.simple} simple, ${byDifficulty.medium} medium, ${byDifficulty.complex} complex`);
console.log(`  Total tool calls: ${RECIPES.reduce((sum, r) => sum + r.actions.length, 0)}`);
console.log(`\nFiles:`);
console.log(`  ${path.join(OUTPUT_DIR, "finetune.jsonl")}`);
console.log(`  ${path.join(OUTPUT_DIR, "recipes.json")}`);
console.log(`\nTo add more recipes, edit src/lib/training/compositionRecipes.ts and re-run.`);

import "server-only";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// import { createOllama } from "ollama-ai-provider-v2";
import { openrouter } from "@openrouter/ai-sdk-provider";

import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";

const localOpenAIProvider = createOpenAICompatible({
  name: "Local OpenAI",
  baseURL: "http://172.16.100.249:8002/v1",
  apiKey: "EMPTY",
});

// const ollama = createOllama({
//   baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
// });

// ==============================
//  STATIC MODELS
// ==============================

const staticModels = {
  openRouter: {
    "x-ai/grok-3-mini": openrouter("x-ai/grok-3-mini"),
  },

  "local-llm": {
    "gpt-oss-20b": localOpenAIProvider("gpt-oss-20b"),
    "Nemotron-3-Nano-30B-A3B-FP8": localOpenAIProvider(
      "Nemotron-3-Nano-30B-A3B-FP8",
    ),
  },
  openai: {
    "gpt-4.1": localOpenAIProvider("gpt-4.1"),
  },
};

const staticUnsupportedModels = new Set<LanguageModel>([]);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set<LanguageModel>([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

// ==============================
// 🧪 HELPER FUNCTION
// ==============================
export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

// ==============================
// 🎯 FALLBACK MODEL
// ==============================
const fallbackModel = staticModels.openai["gpt-4.1"];

// ==============================
// 📦 EXPORT MODEL PROVIDER
// ==============================
export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
    })),
  })),

  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};

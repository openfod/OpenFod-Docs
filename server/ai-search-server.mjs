import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";

const vectorSize = 384;
const port = Number(process.env.AI_QA_PORT || 3000);
const indexDir = process.env.AI_INDEX_DIR || join(process.cwd(), "build", "ai", "index");
const maxModelSources = Number(process.env.AI_QA_MAX_MODEL_SOURCES || process.env.AI_QA_MAX_SOURCES || 10);
const configPath = process.env.AI_QA_CONFIG || fileURLToPath(new URL("./ai-search.config.json", import.meta.url));

const defaultLlmConfig = {
  enabled: false,
  base_url: "",
  api_key: "",
  model: "",
  thinking: { type: "disabled" },
  reasoning_effort: "",
  stream: false,
  timeout_ms: 30000,
  docs_url_prefix: "",
  max_context_chars: 5200,
  source_excerpt_chars: 1200,
  system_prompt: "",
};

const indexes = new Map();
let llmConfigPromise;

function tokenize(value) {
  const tokens = [];
  const fragments = String(value || "").toLowerCase().match(/[a-z0-9_]+|[\u4e00-\u9fff]+/gu) || [];
  for (const fragment of fragments) {
    if (/^[\u4e00-\u9fff]+$/u.test(fragment)) {
      const characters = Array.from(fragment);
      tokens.push(...characters);
      for (let index = 0; index < characters.length - 1; index += 1) {
        tokens.push(`${characters[index]}${characters[index + 1]}`);
      }
    } else {
      tokens.push(fragment);
    }
  }
  return tokens;
}

function embeddingForText(value) {
  const vector = Array(vectorSize).fill(0);
  for (const token of tokenize(value)) {
    const digest = createHash("sha256").update(token).digest();
    const index = digest.readUInt32BE(0) % vectorSize;
    vector[index] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, component) => sum + component * component, 0)) || 1;
  return vector.map((component) => component / norm);
}

function booleanFromValue(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function numberFromValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function streamFromConfig(config) {
  return booleanFromValue(process.env.AI_QA_STREAM, config.stream) === true;
}

async function loadLlmConfig() {
  if (!llmConfigPromise) {
    llmConfigPromise = readFile(configPath, "utf8")
      .then((content) => JSON.parse(content))
      .catch(() => ({}))
      .then((fileConfig) => {
        const config = {
          ...defaultLlmConfig,
          ...fileConfig,
          thinking: {
            ...defaultLlmConfig.thinking,
            ...(fileConfig.thinking || {}),
          },
        };

        config.base_url = process.env.AI_QA_BASE_URL || process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || process.env.DEEPSEEK_BASE_URL || config.base_url;
        config.api_key = process.env.AI_QA_API_KEY || process.env.LLM_APIKEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || config.api_key;
        config.model = process.env.AI_QA_MODEL || process.env.LLM_MODEL || process.env.OPENAI_MODEL || process.env.DEEPSEEK_MODEL || config.model;
        const hasRemoteModel = Boolean(config.base_url && config.api_key && config.model);
        config.enabled = booleanFromValue(process.env.AI_QA_LLM_ENABLED, hasRemoteModel || config.enabled);
        config.reasoning_effort = process.env.AI_QA_REASONING_EFFORT || config.reasoning_effort;
        config.thinking.type = process.env.AI_QA_THINKING || config.thinking.type;
        config.stream = streamFromConfig(config);
        config.timeout_ms = numberFromValue(process.env.AI_QA_TIMEOUT_MS, numberFromValue(config.timeout_ms, defaultLlmConfig.timeout_ms));
        config.docs_url_prefix = process.env.AI_QA_DOCS_URL_PREFIX || process.env.DOCS_URL_PREFIX || config.docs_url_prefix;
        config.max_context_chars = numberFromValue(config.max_context_chars, defaultLlmConfig.max_context_chars);
        config.source_excerpt_chars = numberFromValue(config.source_excerpt_chars, defaultLlmConfig.source_excerpt_chars);
        return config;
      });
  }
  return llmConfigPromise;
}

function cosineSimilarity(left, right) {
  let score = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    score += left[index] * right[index];
  }
  return score;
}

function lexicalBoost(question, chunk) {
  const queryTokens = Array.from(new Set(tokenize(question).filter((token) => token.length > 1)));
  const titleText = `${chunk.title || ""} ${chunk.section || ""}`.toLowerCase();
  const contentText = String(chunk.content || "").toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (titleText.includes(token)) score += 0.12;
    if (contentText.includes(token)) score += 0.03;
  }
  return score;
}

async function loadLanguage(language) {
  if (indexes.has(language)) return indexes.get(language);
  const filePath = join(indexDir, `chunks_${language}.json`);
  const chunks = JSON.parse(await readFile(filePath, "utf8"));
  indexes.set(language, chunks);
  return chunks;
}

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const buffers = [];
  for await (const buffer of request) buffers.push(buffer);
  if (!buffers.length) return {};
  return JSON.parse(Buffer.concat(buffers).toString("utf8"));
}

function excerpt(value, maxLength = 420) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength);
  const breakIndex = Math.max(
    clipped.lastIndexOf("。"),
    clipped.lastIndexOf("."),
    clipped.lastIndexOf(";"),
    clipped.lastIndexOf("；"),
    clipped.lastIndexOf(" ")
  );
  return `${clipped.slice(0, breakIndex > 180 ? breakIndex : maxLength).trim()}...`;
}

function sourceLabel(source) {
  return source.section && source.section !== source.title
    ? `${source.title} / ${source.section}`
    : source.title;
}

function buildSourceContext(sources, config) {
  let remaining = config.max_context_chars;
  const blocks = [];
  for (const [index, source] of sources.entries()) {
    if (remaining <= 0) break;
    const content = excerpt(source.content, Math.min(config.source_excerpt_chars, remaining));
    const block = `[${index + 1}] ${sourceLabel(source)}\nURL: ${source.url}\n${content}`;
    blocks.push(block);
    remaining -= block.length;
  }
  return blocks.join("\n\n");
}

function defaultSystemPrompt(language) {
  if (language === "en") {
    return "You are the OpenFoD documentation assistant. Answer only from the provided documentation context. If the context is insufficient, say that the current docs do not contain enough information. Keep the answer concise and practical.";
  }
  return "你是 OpenFoD 文档问答助手。只能依据给定的文档片段回答；如果片段信息不足，要明确说明当前文档没有足够信息。回答要简洁、可执行，不要编造。";
}

function chatCompletionsUrl(baseUrl) {
  const normalized = String(baseUrl || "").replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

function normalizeDocsUrlPrefix(value) {
  var prefix = String(value || "").trim().replace(/\/+$/, "");
  if (!prefix) return "";
  if (/^https?:\/\//i.test(prefix)) return prefix;
  return prefix.startsWith("/") ? prefix : `/${prefix}`;
}

function sourceUrl(value, config) {
  const url = String(value || "#");
  const prefix = normalizeDocsUrlPrefix(config.docs_url_prefix);
  if (!prefix || url === "#" || /^https?:\/\//i.test(url)) return url;
  if (url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}#`)) return url;
  return url.startsWith("/") ? `${prefix}${url}` : `${prefix}/${url}`;
}

async function callLanguageModel(question, sources, language, config) {
  if (!config.enabled || !config.base_url || !config.api_key || !config.model || !sources.length) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeout_ms);
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: config.system_prompt || defaultSystemPrompt(language) },
      {
        role: "user",
        content: `Question:\n${question}\n\nDocumentation context:\n${buildSourceContext(sources, config)}`,
      },
    ],
    stream: config.stream,
  };
  if (config.thinking?.type) body.thinking = config.thinking;
  if (config.reasoning_effort) body.reasoning_effort = config.reasoning_effort;

  try {
    const response = await fetch(chatCompletionsUrl(config.base_url), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return String(data.choices?.[0]?.message?.content || "").trim() || null;
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function pickAnswer(question, sources, language) {
  if (!sources.length) {
    return language === "en"
      ? "No matching content was found in the current documentation."
      : "未在当前文档中找到相关内容。";
  }
  const lead = language === "en"
    ? `Based on the current documentation, here are the most relevant notes for "${question}":`
    : `根据当前文档，关于“${question}”可以参考以下内容：`;
  const snippets = sources.slice(0, 3).map((source) => {
    return `- ${sourceLabel(source)}: ${excerpt(source.content)}`;
  });
  return `${lead}\n\n${snippets.join("\n\n")}`;
}

async function handleChat(request, response) {
  let payload;
  try {
    payload = await readBody(request);
  } catch (error) {
    jsonResponse(response, 400, { error: "Invalid JSON body" });
    return;
  }
  const language = payload.language === "en" ? "en" : "zh";
  const question = String(payload.question || "").trim();
  if (!question) {
    jsonResponse(response, 400, { error: "Question is required" });
    return;
  }

  try {
    const chunks = await loadLanguage(language);
    const queryEmbedding = embeddingForText(question);
    const ranked = chunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding || []) + lexicalBoost(question, chunk),
      }))
      .sort((first, second) => second.score - first.score)
      .slice(0, maxModelSources)
      .filter((chunk) => chunk.score > 0);
    const config = await loadLlmConfig();
    const sources = ranked.map((chunk) => ({
      title: chunk.title,
      section: chunk.section,
      url: sourceUrl(chunk.docs_url, config),
      score: chunk.score,
      content: chunk.content,
    }));
    const modelAnswer = await callLanguageModel(question, sources, language, config);
    jsonResponse(response, 200, {
      answer: modelAnswer || pickAnswer(question, sources, language),
      sources: sources.map(({ content, ...source }) => source),
    });
  } catch (error) {
    jsonResponse(response, 500, { error: "AI search index is unavailable" });
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    response.end();
    return;
  }
  if (request.method === "GET" && requestUrl.pathname === "/api/ai-qa/healthz") {
    jsonResponse(response, 200, { ok: true });
    return;
  }
  if (request.method === "POST" && requestUrl.pathname === "/api/ai-qa/chat") {
    await handleChat(request, response);
    return;
  }
  jsonResponse(response, 404, { error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI search service listening on 127.0.0.1:${port}`);
});
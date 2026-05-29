import type { Scene, Tone } from "./options";

const systemPrompt = `你是一个中文表达改写助手，擅长把用户不方便直接说的话，改写成适合发送出去的表达。

你的任务：
根据用户输入的原话、使用场景、目标语气，生成 3 条可以直接发送的中文回复。

要求：
1. 不要解释，不要说教。
2. 每条回复要自然，像真人发消息。
3. 每条控制在 60 字以内。
4. 不要使用夸张网络腔。
5. 不要过度讨好。
6. 根据场景调整边界感。
7. 如果语气是“阴阳怪气”，要轻微幽默，但不要恶毒。
8. 如果语气是“强硬”，要清楚表达边界，但不要辱骂。
9. 如果语气是“高情商”，要体面、委婉、保留关系。
10. 只返回 JSON，不要返回 markdown，不要返回解释。

返回格式必须是：
{
  "results": [
    "版本1内容",
    "版本2内容",
    "版本3内容"
  ]
}`;

type ModelMessage = {
  role: "system" | "user";
  content: string;
};

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class TranslatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslatorError";
  }
}

export async function translatePlainText({
  input,
  scene,
  tone,
}: {
  input: string;
  scene: Scene;
  tone: Tone;
}): Promise<string[]> {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new TranslatorError("服务还没有配置大模型 API Key，请先配置环境变量。");
  }

  const userPrompt = `原话：${input}
场景：${scene}
语气：${tone}

请把这句话改写成 3 条适合发送出去的表达。`;

  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    throw new TranslatorError("模型服务暂时连接不上，请稍后再试。");
  }

  if (!response.ok) {
    throw new TranslatorError("翻译服务暂时不可用，请稍后再试。");
  }

  const payload = (await response.json()) as ChatResponse;
  const content = payload.choices?.[0]?.message?.content;
  const results = normalizeResults(content);

  if (results.length !== 3) {
    throw new TranslatorError("这次没翻译好，请再试一次。");
  }

  return results;
}

export function normalizeResults(content: unknown): string[] {
  if (typeof content !== "string") return [];

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = parseJsonResults(cleaned) ?? parseLineResults(cleaned);

  return candidates
    .map((item) => item.replace(/^["'“”‘’\s-]*(?:版本\s*\d+[:：.]?)?\s*/i, "").trim())
    .filter(Boolean)
    .map((item) => (item.length > 80 ? item.slice(0, 80) : item))
    .slice(0, 3);
}

function parseJsonResults(content: string): string[] | null {
  try {
    const parsed = JSON.parse(content) as { results?: unknown };
    if (Array.isArray(parsed.results)) {
      return parsed.results.filter((item): item is string => typeof item === "string");
    }
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as { results?: unknown };
      if (Array.isArray(parsed.results)) {
        return parsed.results.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return null;
    }
  }

  return null;
}

function parseLineResults(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)、]|[-*])\s*/, "").trim())
    .filter(Boolean);
}

import { NextResponse } from "next/server";
import { isScene, isTone } from "@/lib/options";
import { translatePlainText, TranslatorError } from "@/lib/translator";

type TranslateBody = {
  input?: unknown;
  scene?: unknown;
  tone?: unknown;
};

export async function POST(request: Request) {
  let body: TranslateBody;

  try {
    body = (await request.json()) as TranslateBody;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";

  if (!input) {
    return NextResponse.json({ error: "请先输入一句话。" }, { status: 400 });
  }

  if (input.length > 300) {
    return NextResponse.json({ error: "原话最多 300 字，请删短一点。" }, { status: 400 });
  }

  if (!isScene(body.scene)) {
    return NextResponse.json({ error: "请选择有效场景。" }, { status: 400 });
  }

  if (!isTone(body.tone)) {
    return NextResponse.json({ error: "请选择有效语气。" }, { status: 400 });
  }

  try {
    const results = await translatePlainText({
      input,
      scene: body.scene,
      tone: body.tone,
    });

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof TranslatorError ? error.message : "翻译失败了，请稍后再试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

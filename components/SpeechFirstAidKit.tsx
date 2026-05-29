"use client";

import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { scenes, tones, type Scene, type Tone } from "@/lib/options";

const examples = [
  "我不想去",
  "别催我了",
  "这个需求不合理",
  "我不想加班",
  "我不想帮这个忙",
  "这个价格太低了",
  "你这样说我不舒服",
  "我现在不想聊",
];

type ApiResponse = {
  results?: string[];
  error?: string;
};

export default function SpeechFirstAidKit() {
  const [input, setInput] = useState("");
  const [scene, setScene] = useState<Scene>("职场");
  const [tone, setTone] = useState<Tone>("体面");
  const [results, setResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const selectedResult = results[selectedIndex] ?? results[0] ?? "";
  const canGenerate = input.trim().length > 0 && !isLoading;

  const charCountText = useMemo(() => `${input.trim().length}/300`, [input]);

  async function generate() {
    const trimmed = input.trim();

    if (!trimmed) {
      setError("请先输入一句话。");
      return;
    }

    if (trimmed.length > 300) {
      setError("原话最多 300 字，请删短一点。");
      return;
    }

    setIsLoading(true);
    setError("");
    setShareMessage("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, scene, tone }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || "翻译失败了，请稍后再试。");
      }

      setResults(data.results.slice(0, 3));
      setSelectedIndex(0);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "翻译失败了，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyResult(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1400);
    } catch {
      setError("复制失败，请手动选中文字复制。");
    }
  }

  async function exportShareImage() {
    if (!shareCardRef.current || !selectedResult) return;

    setIsExporting(true);
    setError("");
    setShareMessage("");

    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#fbfaf7",
        width: 360,
        height: 480,
        style: {
          width: "360px",
          height: "480px",
        },
      });
      setShareImageUrl(dataUrl);
      setShareMessage("分享图已生成。没有自动下载的话，可以长按图片保存，或点击下方链接下载。");
      const link = document.createElement("a");
      link.download = `不会说话急救箱-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("分享图生成失败，请稍后再试。");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f3f1] px-4 py-6 text-ink sm:py-10">
      <div className="mx-auto w-full max-w-[720px]">
        <section className="rounded-[24px] bg-paper px-5 py-7 shadow-sm ring-1 ring-black/5 sm:px-8 sm:py-10">
          <header className="space-y-3">
            <h1 className="text-[34px] font-black leading-tight tracking-normal sm:text-5xl">
              不会说话急救箱
            </h1>
            <p className="text-lg font-semibold leading-8 text-neutral-900">
              把不能直接说的话，翻译成能发出去的话。
            </p>
            <p className="max-w-xl text-sm leading-6 text-neutral-600">
              适合职场、朋友、家人、客户、聊天等尴尬场景。帮你做消息改写、体面拒绝、聊天回复、职场话术、高情商回复，也能生成轻微的阴阳怪气回复。
            </p>
          </header>

          <div className="mt-7 space-y-7">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="raw-text" className="text-sm font-bold">
                  你想翻译的话
                </label>
                <span className="text-xs text-neutral-500">{charCountText}</span>
              </div>
              <textarea
                id="raw-text"
                value={input}
                maxLength={300}
                onChange={(event) => setInput(event.target.value)}
                placeholder="输入一句你不方便直接说的话，比如：我不想去、别催我、这个需求不合理"
                className="min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-base leading-7 text-neutral-950 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-black/5"
              />
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setInput(example);
                      setError("");
                    }}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition active:scale-[0.98] sm:hover:border-neutral-900"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </section>

            <OptionGroup
              label="场景选择"
              options={scenes}
              value={scene}
              onChange={setScene}
            />

            <OptionGroup
              label="语气选择"
              options={tones}
              value={tone}
              onChange={setTone}
            />

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canGenerate}
              onClick={generate}
              className="w-full rounded-2xl bg-neutral-950 px-5 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.99] disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              {isLoading ? "正在翻译成人话..." : "开始翻译"}
            </button>
          </div>
        </section>

        {results.length > 0 ? (
          <section className="mt-5 rounded-[24px] bg-white px-5 py-6 shadow-sm ring-1 ring-black/5 sm:px-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">翻译结果</h2>
                <p className="mt-1 text-sm text-neutral-500">选择一条，可以复制或生成分享图。</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {results.map((result, index) => (
                <article
                  key={`${result}-${index}`}
                  className={`rounded-2xl border p-4 transition ${
                    selectedIndex === index
                      ? "border-neutral-950 bg-neutral-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className="flex min-w-0 items-center gap-2 text-left"
                      aria-pressed={selectedIndex === index}
                    >
                      <span
                        className={`size-4 rounded-full border ${
                          selectedIndex === index
                            ? "border-neutral-950 bg-neutral-950 shadow-[inset_0_0_0_4px_#fff]"
                            : "border-neutral-300 bg-white"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-bold">版本 {index + 1}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyResult(result, index)}
                      className="shrink-0 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white active:scale-[0.98]"
                    >
                      {copiedIndex === index ? "已复制" : "复制"}
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-neutral-900">
                    {result}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={generate}
                className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-950 transition active:scale-[0.99] disabled:text-neutral-400"
              >
                {isLoading ? "正在生成..." : "换一种说法"}
              </button>
              <button
                type="button"
                disabled={isExporting || !selectedResult}
                onClick={exportShareImage}
                className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:bg-neutral-300 disabled:text-neutral-500"
              >
                {isExporting ? "正在生成..." : "生成分享图"}
              </button>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold">分享图预览</p>
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 p-3">
                <ShareCard
                  ref={shareCardRef}
                  input={input.trim()}
                  result={selectedResult}
                  scene={scene}
                  tone={tone}
                />
              </div>
              {shareMessage ? (
                <p className="mt-3 rounded-2xl bg-neutral-100 px-4 py-3 text-sm leading-6 text-neutral-700">
                  {shareMessage}
                </p>
              ) : null}
              {shareImageUrl ? (
                <div className="mt-3 space-y-3">
                  <img
                    src={shareImageUrl}
                    alt="不会说话急救箱分享图"
                    className="mx-auto w-full max-w-[360px] rounded-2xl border border-neutral-200 bg-white"
                  />
                  <a
                    href={shareImageUrl}
                    download={`不会说话急救箱-${Date.now()}.png`}
                    className="block rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-bold text-neutral-950 active:scale-[0.99]"
                  >
                    下载 PNG
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mt-5 rounded-[24px] bg-white px-5 py-6 shadow-sm ring-1 ring-black/5 sm:px-8">
          <h2 className="text-lg font-black">怎么用</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
            <li>1. 输入一句不能直接说的话</li>
            <li>2. 选择场景和语气</li>
            <li>3. 生成能发出去的表达</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <section className="space-y-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
              value === option
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 sm:hover:border-neutral-900"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

const ShareCard = ({
  input,
  result,
  scene,
  tone,
  ref,
}: {
  input: string;
  result: string;
  scene: Scene;
  tone: Tone;
  ref: React.Ref<HTMLDivElement>;
}) => {
  return (
    <div
      ref={ref}
      className="mx-auto flex aspect-[3/4] w-full max-w-[360px] flex-col bg-[#fbfaf7] p-8 text-left text-[#161616]"
    >
      <div className="text-[26px] font-black leading-none">不会说话急救箱</div>

      <div className="mt-10 space-y-8">
        <div>
          <div className="text-[15px] font-black leading-6">原话：</div>
          <p className="mt-3 whitespace-pre-wrap text-[20px] font-semibold leading-8">
            {input}
          </p>
        </div>

        <div>
          <div className="text-[15px] font-black leading-6">翻译后：</div>
          <p className="mt-3 whitespace-pre-wrap text-[22px] font-black leading-9">
            {result}
          </p>
        </div>
      </div>

      <div className="mt-auto border-t border-neutral-300 pt-5">
        <p className="text-[15px] font-semibold leading-6">
          场景：{scene} ｜ 语气：{tone}
        </p>
        <p className="mt-3 text-[12px] leading-5 text-neutral-600">
          把不能直接说的话，翻译成能发出去的话
        </p>
      </div>
    </div>
  );
};

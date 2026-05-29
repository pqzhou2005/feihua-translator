export const scenes = ["职场", "朋友", "家人", "客户", "暧昧聊天"] as const;
export const tones = ["体面", "礼貌", "冷淡", "强硬", "高情商", "阴阳怪气"] as const;

export type Scene = (typeof scenes)[number];
export type Tone = (typeof tones)[number];

export function isScene(value: unknown): value is Scene {
  return typeof value === "string" && scenes.includes(value as Scene);
}

export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && tones.includes(value as Tone);
}

# 不会说话急救箱

移动端优先的中文表达改写小工具：把不能直接说的话，翻译成能发出去的话。

## 功能

- 输入一句不方便直接说的话
- 选择场景：职场、朋友、家人、客户、暧昧聊天
- 选择语气：体面、礼貌、冷淡、强硬、高情商、阴阳怪气
- 生成 3 条可复制的回复
- 重新生成不同说法
- 选择其中一条生成 3:4 分享图，并下载 PNG

## 环境变量

复制示例文件：

```bash
cp .env.example .env.local
```

填写：

```bash
LLM_API_KEY=你的大模型 API Key
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
```

也可以使用 `OPENAI_API_KEY`。后端只在服务端读取 API Key，不会暴露到前端。

`LLM_BASE_URL` 使用 OpenAI 兼容的 `/chat/completions` 接口。当前默认配置为 DeepSeek，后续替换模型供应商只需要调整环境变量或 `lib/translator.ts`。

## 启动

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 验证

```bash
npm run typecheck
npm run build
```

## 项目结构

```text
app/
  api/translate/route.ts  后端接口
  layout.tsx              SEO 和全局布局
  page.tsx                首页
components/
  SpeechFirstAidKit.tsx   工具 UI 和分享图导出
lib/
  options.ts              场景、语气枚举
  translator.ts           模型调用和返回结果清洗
```

export type GenerationInput = { system: string; user: string; context: string[]; history?:Array<{role:"user"|"assistant";content:string}> };
export interface HessaModelProvider { readonly name: string; generate(input: GenerationInput): Promise<string>; }

export class SafeFallbackProvider implements HessaModelProvider {
  readonly name = "safe-fallback";
  async generate(input: GenerationInput) {
    if (input.context.length > 0) return `بحسب محتوى الدرس المتاح: ${input.context[0].slice(0, 700)}\n\nسؤالك: ${input.user}`;
    return "أحتاج محتوى الدرس أو نموذجًا لغويًا موصولًا حتى أشرح هذا السؤال بدقة، ولن أخمّن إجابة غير متحققة.";
  }
}

export class OpenAICompatibleLocalProvider implements HessaModelProvider {
  readonly name: string;
  constructor(
    private readonly baseUrl = process.env.HESSA_LLM_BASE_URL ?? "http://127.0.0.1:8000/v1",
    private readonly model = process.env.HESSA_LLM_MODEL ?? "open-weight-model",
    private readonly apiKey = process.env.HESSA_LLM_API_KEY ?? "local"
  ) { this.name = `open-weight:${this.model}`; }

  async generate(input: GenerationInput) {
    const root=this.baseUrl.replace(/\/$/, "");const endpoint=`${root.endsWith("/v1")?root:root+"/v1"}/chat/completions`;const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: input.system },
          ...(input.history??[]).slice(-6).map(turn=>({role:turn.role,content:turn.content})),
          { role: "user", content: input.context.length ? `السياق المنهجي:\n${input.context.join("\n\n---\n\n")}\n\nسؤال الطالب:\n${input.user}` : input.user }
        ]
      })
    });
    if (!response.ok){const body=await response.text();throw new Error(`Local LLM failed: HTTP ${response.status} ${body.slice(0,500)}`);}
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("Local LLM returned an empty response");
    return answer;
  }
}

export function createModelProvider(): HessaModelProvider {
  return process.env.HESSA_LLM_ENABLED === "true" ? new OpenAICompatibleLocalProvider() : new SafeFallbackProvider();
}

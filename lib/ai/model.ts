import { HttpError } from "@/lib/http";
export async function modelReply(
  instructions: string,
  messages: { role: string; content: string }[],
) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL,
      store: false,
      max_output_tokens: 1800,
      instructions,
      input: messages,
    }),
  });
  if (!response.ok) throw new HttpError(502, "خدمة المساعد غير متاحة الآن");
  const data = (await response.json()) as {
    output?: { content?: { type: string; text?: string }[] }[];
  };
  const answer = (data.output || [])
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text || "")
    .join("\n");
  if (!answer) throw new HttpError(502, "لم تصل إجابة من المساعد");
  return answer;
}


import type { VerificationResult } from "./types";

type Teaching = {
  answer: string;
  verification: VerificationResult;
};

function normalize(text: string) {
  return text.normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06F0));
}

function gcd(a: number, b: number): number {
  while (b) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return Math.abs(a);
}

function fraction(n: number, d: number) {
  const factor = gcd(n, d) || 1;
  n /= factor;
  d /= factor;
  if (d < 0) { n = -n; d = -d; }
  return d === 1 ? String(n) : `${n}/${d}`;
}

function valid(values: number[]) {
  return values.every(value =>
    Number.isSafeInteger(value) && Math.abs(value) <= 1000000
  );
}

export function resolveFractionTeaching(
  message: string,
  reveal: boolean,
  correcting: boolean
): Teaching | null {
  if (!reveal) return null;
  const m = normalize(message);

  const sum = m.match(
    /(-?\d+)\s*\/\s*(\d+)\s*([+-])\s*(-?\d+)\s*\/\s*(\d+)(?:\s*=\s*(-?\d+)\s*\/\s*(\d+))?/
  );

  if (sum && correcting) {
    const a = Number(sum[1]), b = Number(sum[2]);
    const op = sum[3];
    const c = Number(sum[4]), d = Number(sum[5]);
    if (!valid([a,b,c,d]) || !b || !d) return null;

    const numerator = op === "+" ? a*d+c*b : a*d-c*b;
    const denominator = b*d;
    const result = fraction(numerator, denominator);

    let judgment = "";
    let specific = "";
    if (sum[6] !== undefined) {
      const claimedN = Number(sum[6]), claimedD = Number(sum[7]);
      if (!valid([claimedN,claimedD]) || !claimedD) return null;
      const correct = claimedN*denominator === numerator*claimedD;
      judgment = correct ? "نعم، الناتج اللي كتبته صحيح. " :
                           "الناتج اللي كتبته غير صحيح. ";
      if (!correct && b === d && claimedD === b+d) {
        specific = "الغلط في جمع المقامين؛ حجم الجزء ما تغير. ";
      }
    }

    const explanation = b === d
      ? `المقامات متساوية، يعني الأجزاء بنفس الحجم. ${
          op === "+" ? "نجمع" : "نطرح"
        } البسطين ونخلي المقام نفسه: (${a} ${op} ${c})/${b} = ${result}.`
      : `الأجزاء بأحجام مختلفة، فنحتاج مقامًا مشتركًا. نحول ${a}/${b} إلى ${a*d}/${b*d}، و${c}/${d} إلى ${c*b}/${b*d}. بعدها ${
          op === "+" ? "نجمع" : "نطرح"
        } البسطين ونبسط: ${result}.`;

    return {
      answer: judgment + specific + explanation,
      verification: {
        verified: true,
        confidence: 1,
        method: "fraction-operation-teaching-engine",
        expectedAnswer: result,
        issues: []
      }
    };
  }

  // لا نعالج جمع الكسور باعتباره مقارنة.
  if (sum) return null;
  if (!/(?:اكبر|اصغر|قارن|مقارنة|متساوي)/.test(m)) return null;

  const fractions = [...m.matchAll(/(-?\d+)\s*\/\s*(\d+)/g)];
  if (fractions.length !== 2) return null;

  const a = Number(fractions[0][1]), b = Number(fractions[0][2]);
  const c = Number(fractions[1][1]), d = Number(fractions[1][2]);
  if (!valid([a,b,c,d]) || !b || !d) return null;

  const left = a*d, right = c*b;
  const relation = left < right ? "<" : left > right ? ">" : "=";
  const conclusion = `${a}/${b} ${relation} ${c}/${d}`;
  const explanation = a === c && a > 0
    ? "لما نقسم نفس الكمية إلى أجزاء أكثر، كل جزء يصير أصغر. ومع تساوي البسطين الموجبين، الكسر اللي مقامه أكبر يكون أصغر."
    : `نتحقق بالضرب التبادلي لأن المقامين موجبان: ${a} × ${d} = ${left}، و${c} × ${b} = ${right}. مقارنة الناتجين تعطينا ترتيب الكسرين.`;

  return {
    answer: `المقارنة الصحيحة: ${conclusion}. ${explanation}`,
    verification: {
      verified: true,
      confidence: 1,
      method: "fraction-comparison-teaching-engine",
      expectedAnswer: conclusion,
      issues: []
    }
  };
}

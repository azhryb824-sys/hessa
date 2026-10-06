import type { VerificationResult } from "./types";

type SolvedMath = { answer: string; expectedAnswer: string; kind: string };
const toAscii = (v: string) => v.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/٫/g, ".");

function format(n: number) { return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(8))); }

export function solveDeterministicMath(message: string): SolvedMath | null {
  const text = toAscii(message).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

  const percent = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:من|of)\s*(\d+(?:\.\d+)?)/i);
  if (percent) { const p=Number(percent[1]), base=Number(percent[2]), value=p*base/100; return {kind:"percentage",expectedAnswer:format(value),answer:`${p}% من ${base} = ${p}/100 × ${base} = ${format(value)}.`}; }

  const ratio = text.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (ratio) { const a=Number(ratio[1]), b=Number(ratio[2]); if(b!==0){ const gcd=(x:number,y:number):number=>y?gcd(y,x%y):Math.abs(x); const g=gcd(a,b)||1; return {kind:"ratio",expectedAnswer:`${a/g}:${b/g}`,answer:`نبسّط النسبة ${a}:${b} بقسمة الطرفين على ${g}، فتصبح ${a/g}:${b/g}.`}; } }

  const fraction = text.match(/(-?\d+)\s*\/\s*(-?\d+)\s*([+\-])\s*(-?\d+)\s*\/\s*(-?\d+)/);
  if (fraction) { const a=Number(fraction[1]),b=Number(fraction[2]),op=fraction[3],c=Number(fraction[4]),d=Number(fraction[5]); if(b&&d){const num=op==="+"?a*d+c*b:a*d-c*b, den=b*d; const gcd=(x:number,y:number):number=>y?gcd(y,x%y):Math.abs(x); const g=gcd(num,den)||1; const n=num/g, q=den/g; return {kind:"fraction",expectedAnswer:`${n}/${q}`,answer:`نوحّد المقام: الناتج ${num}/${den}، وبعد التبسيط = ${n}/${q}.`};}}

  const equation = text.match(/(?:^|\s)(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if(equation){const op=equation[1],a=Number(equation[2]),b=Number(equation[3]),x=op==="+"?b-a:b+a;return{kind:"linear-equation",expectedAnswer:format(x),answer:`نعزل المجهول: س = ${format(x)}. وبالتعويض نتحقق أن الطرفين متساويان.`};}

  const arithmetic = text.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);
  if (arithmetic) { const left=Number(arithmetic[1]),op=arithmetic[2],right=Number(arithmetic[3]); if(op==="/"&&right===0)return null; const value=op==="+"?left+right:op==="-"?left-right:op==="*"?left*right:left/right; const symbol=op==="*"?"×":op==="/"?"÷":op; return {kind:"arithmetic",expectedAnswer:format(value),answer:`نحلها خطوة خطوة: ${left} ${symbol} ${right} = ${format(value)}. إذن الناتج هو ${format(value)}.`}; }

  return null;
}

export function verifyMathAnswer(message:string,candidate:string):VerificationResult {
  const solved=solveDeterministicMath(message);
  if(!solved)return{verified:false,confidence:.35,method:"no-deterministic-check-available",issues:["المسألة خارج نطاق المحقق الحتمي الحالي؛ يجب عدم اعتبار الإجابة مؤكدة قبل التحقق بأداة رياضية مناسبة."]};
  const normalized=toAscii(candidate).replace(/\s/g,"");
  const expected=solved.expectedAnswer.replace(/\s/g,"");
  const verified=normalized.includes(expected);
  return{verified,confidence:verified?.99:.95,method:`deterministic-${solved.kind}-verifier`,expectedAnswer:solved.expectedAnswer,issues:verified?[]:["الإجابة المولدة لا تحتوي النتيجة التي أثبتها المحقق الحتمي."]};
}

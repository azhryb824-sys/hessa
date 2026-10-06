import type { VerificationResult } from "./types";

type SolvedMath = { answer: string; expectedAnswer: string; kind: string };
const toAscii = (v: string) => v.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/٫/g, ".");

function format(n: number) { return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(8))); }

export function solveDeterministicMath(message: string): SolvedMath | null {
  const text = toAscii(message).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

  const percent = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:من|of)\s*(\d+(?:\.\d+)?)/i);
  if (percent) { const p=Number(percent[1]), base=Number(percent[2]), value=p*base/100; return {kind:"percentage",expectedAnswer:format(value),answer:`النسبة ${p}% تعني ${p} من كل 100. لذلك نحولها إلى ${p}/100 ثم نضرب في ${base}: ${p}/100 × ${base} = ${format(value)}. إذن الناتج هو ${format(value)}.`}; }

  const ratio = text.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (ratio) { const a=Number(ratio[1]), b=Number(ratio[2]); if(b!==0){ const gcd=(x:number,y:number):number=>y?gcd(y,x%y):Math.abs(x); const g=gcd(a,b)||1; return {kind:"ratio",expectedAnswer:`${a/g}:${b/g}`,answer:`نبسّط النسبة ${a}:${b} بقسمة الطرفين على ${g}، فتصبح ${a/g}:${b/g}.`}; } }

  const fraction = text.match(/(-?\d+)\s*\/\s*(-?\d+)\s*([+\-])\s*(-?\d+)\s*\/\s*(-?\d+)/);
  if (fraction) { const a=Number(fraction[1]),b=Number(fraction[2]),op=fraction[3],c=Number(fraction[4]),d=Number(fraction[5]); if(b&&d){const num=op==="+"?a*d+c*b:a*d-c*b, den=b*d; const gcd=(x:number,y:number):number=>y?gcd(y,x%y):Math.abs(x); const g=gcd(num,den)||1; const n=num/g, q=den/g; return {kind:"fraction",expectedAnswer:`${n}/${q}`,answer:`حتى نجمع أو نطرح الكسور، نحتاج أجزاء من النوع نفسه. نوحّد المقام أولًا، فنحصل على ${num}/${den}. ثم نبسّط الكسر بقسمة البسط والمقام على العامل المشترك، فيصبح ${n}/${q}. إذن الناتج النهائي هو ${n}/${q}.`};}}

  const equation = text.match(/(?:^|\s)(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if(equation){const op=equation[1],a=Number(equation[2]),b=Number(equation[3]),x=op==="+"?b-a:b+a;return{kind:"linear-equation",expectedAnswer:format(x),answer:`نعزل المجهول: س = ${format(x)}. وبالتعويض نتحقق أن الطرفين متساويان.`};}

  const rectangleArea = text.match(/(?:مساح(?:ه|ة)\s+(?:مستطيل)|مستطيل[^\n]*مساح)(?:[^\d]{0,30})(\d+(?:\.\d+)?)(?:[^\d]{1,30})(\d+(?:\.\d+)?)/i);
  if (rectangleArea) { const a=Number(rectangleArea[1]),b=Number(rectangleArea[2]),value=a*b; return {kind:"rectangle-area",expectedAnswer:format(value),answer:`مساحة المستطيل = الطول × العرض = ${a} × ${b} = ${format(value)}.`}; }

  const rectanglePerimeter = text.match(/(?:محيط\s+(?:مستطيل)|مستطيل[^\n]*محيط)(?:[^\d]{0,30})(\d+(?:\.\d+)?)(?:[^\d]{1,30})(\d+(?:\.\d+)?)/i);
  if (rectanglePerimeter) { const a=Number(rectanglePerimeter[1]),b=Number(rectanglePerimeter[2]),value=2*(a+b); return {kind:"rectangle-perimeter",expectedAnswer:format(value),answer:`محيط المستطيل = 2 × (الطول + العرض) = 2 × (${a} + ${b}) = ${format(value)}.`}; }

  const squareArea = text.match(/(?:مساح(?:ه|ة)\s+(?:مربع)|مربع[^\n]*مساح)(?:[^\d]{0,30})(\d+(?:\.\d+)?)/i);
  if (squareArea) { const a=Number(squareArea[1]),value=a*a; return {kind:"square-area",expectedAnswer:format(value),answer:`مساحة المربع = طول الضلع × نفسه = ${a} × ${a} = ${format(value)}.`}; }

  const triangleArea = text.match(/(?:مساح(?:ه|ة)\s+(?:مثلث)|مثلث[^\n]*مساح)(?:[^\d]{0,30})(\d+(?:\.\d+)?)(?:[^\d]{1,30})(\d+(?:\.\d+)?)/i);
  if (triangleArea) { const base=Number(triangleArea[1]),height=Number(triangleArea[2]),value=base*height/2; return {kind:"triangle-area",expectedAnswer:format(value),answer:`نستخدم قانون مساحة المثلث: القاعدة × الارتفاع ÷ 2. نعوض: ${base} × ${height} ÷ 2 = ${format(value)}. نقسم على 2 لأن المثلث يمثل نصف مستطيل له القاعدة والارتفاع نفسيهما. إذن المساحة = ${format(value)} وحدة مربعة.`}; }

  const axb = text.match(/(-?\d+(?:\.\d+)?)\s*[*x]?\s*(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (axb) { const a=Number(axb[1]),op=axb[2],b=Number(axb[3]),c=Number(axb[4]); if(a!==0){const x=(op==="+"?c-b:c+b)/a;return{kind:"linear-equation-ax-b",expectedAnswer:format(x),answer:`نعزل حد المجهول ثم نقسم على ${a}: س = ${format(x)}. ونتحقق بالتعويض في المعادلة الأصلية.`};} }

  const wordAdd = text.match(/(?:معه|لديه|عنده)\s+(\d+)\s+[^.،؟?]{0,30}(?:زاد|اضاف|أضاف|اشترى|اعطاه|أعطاه)[^\d]{0,20}(\d+)/i);
  if(wordAdd){const a=Number(wordAdd[1]),b=Number(wordAdd[2]),value=a+b;return{kind:"word-addition",expectedAnswer:format(value),answer:`نحدد العملية أولًا: الكمية زادت، إذن نجمع. ${a} + ${b} = ${format(value)}.`};}

  const wordSubtract = text.match(/(?:معه|لديه|عنده)\s+(\d+)\s+[^.،؟?]{0,30}(?:اعطى|أعطى|فقد|استخدم|باع)[^\d]{0,20}(\d+)/i);
  if(wordSubtract){const a=Number(wordSubtract[1]),b=Number(wordSubtract[2]),value=a-b;return{kind:"word-subtraction",expectedAnswer:format(value),answer:`نحدد العملية أولًا: الكمية نقصت، إذن نطرح. ${a} - ${b} = ${format(value)}.`};}

  const divisionByZero = text.match(/(-?\d+(?:\.\d+)?)\s*\/\s*0(?:\D|$)/);
  if (divisionByZero) return {kind:"division-by-zero",expectedAnswer:"غير معرّفة",answer:"القسمة على صفر غير معرّفة. لأننا لو افترضنا أن عددًا ما يساوي "+divisionByZero[1]+" ÷ 0، فسنحتاج عددًا إذا ضربناه في 0 يعطينا "+divisionByZero[1]+"، لكن أي عدد مضروبًا في 0 يساوي 0. لذلك لا يوجد ناتج لهذه القسمة."};

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

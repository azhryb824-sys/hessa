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

  const bothSidesEarly = text.match(/(-?\d+(?:\.\d+)?)\s*(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)/i);
  if(bothSidesEarly){const a=Number(bothSidesEarly[1]),b=(bothSidesEarly[2]==="+"?1:-1)*Number(bothSidesEarly[3]),c=Number(bothSidesEarly[4]),d=(bothSidesEarly[5]==="+"?1:-1)*Number(bothSidesEarly[6]);if(a!==c){const x=(d-b)/(a-c);return{kind:"linear-equation-both-sides",expectedAnswer:format(x),answer:`نجمع حدود المجهول في طرف والثوابت في الطرف الآخر: (${a} - ${c})س = ${format(d-b)}. ثم نقسم على ${format(a-c)} فنحصل على س = ${format(x)}. ونتحقق بالتعويض في الطرفين.`};}}

  const axb = text.match(/(-?\d+(?:\.\d+)?)\s*[*x]?\s*(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (axb) { const a=Number(axb[1]),op=axb[2],b=Number(axb[3]),c=Number(axb[4]); if(a!==0){const x=(op==="+"?c-b:c+b)/a;return{kind:"linear-equation-ax-b",expectedAnswer:format(x),answer:`نعزل حد المجهول ثم نقسم على ${a}: س = ${format(x)}. ونتحقق بالتعويض في المعادلة الأصلية.`};} }

  const wordGot = text.match(/(?:مع|لدى)\s+[^\d]{0,20}(\d+)\s+[^.،؟?]{0,25}(?:ثم\s+)?(?:حصل(?:ت)?\s+على|أخذ(?:ت)?|استلم(?:ت)?)[^\d]{0,20}(\d+)/i);
  if(wordGot){const a=Number(wordGot[1]),b=Number(wordGot[2]),value=a+b;return{kind:"word-addition-got",expectedAnswer:format(value),answer:`الكمية زادت، إذن نجمع: ${a} + ${b} = ${format(value)}.`};}

  const wordGave = text.match(/(?:مع|لدى)\s+[^\d]{0,20}(\d+)\s+[^.،؟?]{0,25}(?:ثم\s+)?(?:أعطى|اعطى|أعطت|اعطت)[^\d]{0,20}(\d+)/i);
  if(wordGave){const a=Number(wordGave[1]),b=Number(wordGave[2]),value=a-b;return{kind:"word-subtraction-gave",expectedAnswer:format(value),answer:`الكمية نقصت، إذن نطرح: ${a} - ${b} = ${format(value)}.`};}

  const wordAdd = text.match(/(?:معه|لديه|عنده)\s+(\d+)\s+[^.،؟?]{0,45}(?:زاد|اضاف|أضاف|اشترى|اعطاه|أعطاه)[^\d]{0,25}(\d+)/i);
  if(wordAdd){const a=Number(wordAdd[1]),b=Number(wordAdd[2]),value=a+b;return{kind:"word-addition",expectedAnswer:format(value),answer:`نحدد العملية أولًا: الكمية زادت، إذن نجمع. ${a} + ${b} = ${format(value)}.`};}

  const wordSubtract = text.match(/(?:معه|لديه|عنده)\s+(\d+)\s+[^.،؟?]{0,30}(?:اعطى|أعطى|فقد|استخدم|باع)[^\d]{0,20}(\d+)/i);
  if(wordSubtract){const a=Number(wordSubtract[1]),b=Number(wordSubtract[2]),value=a-b;return{kind:"word-subtraction",expectedAnswer:format(value),answer:`نحدد العملية أولًا: الكمية نقصت، إذن نطرح. ${a} - ${b} = ${format(value)}.`};}

  if (/0\s*\/\s*0(?:\D|$)/.test(text)) return {kind:"zero-over-zero",expectedAnswer:"غير معيّنة",answer:"0 ÷ 0 حالة خاصة: لا نستطيع تحديد قيمة واحدة للناتج، لأن أي عدد إذا ضربناه في 0 يعطينا 0. لذلك التعبير 0/0 غير معرّف كقسمة عادية، ويُسمّى أيضًا صيغة غير معيّنة في سياق النهايات."};

  const multiStepMoney = text.match(/مع\s+[^\d]{0,20}(\d+)\s*ريال[^\d]{0,30}(?:اشترى|دفع)[^\d]{0,15}(\d+)\s*ريال[^\d]{0,35}(?:أعطاه|اعطاه|حصل|زاد)[^\d]{0,15}(\d+)\s*ريال/i);
  if(multiStepMoney){const a=Number(multiStepMoney[1]),spent=Number(multiStepMoney[2]),added=Number(multiStepMoney[3]),value=a-spent+added;return{kind:"multi-step-money",expectedAnswer:format(value),answer:`نحل حسب ترتيب أحداث المسألة: نبدأ بـ ${a}، ثم نطرح ${spent} لأنه دفعها: ${a} - ${spent} = ${format(a-spent)}. بعد ذلك نضيف ${added}: ${format(a-spent)} + ${added} = ${format(value)}. إذن معه الآن ${format(value)} ريالًا.`};}

  const groupsWord = text.match(/(\d+)\s+مجموعات[^\d]{0,30}(?:(?:في\s+)?كل\s+(?:مجموعة|وحدة)|بكل\s+مجموعة)[^\d]{0,15}(\d+)(?:\s+(?:عناصر|عنصر|أشياء|اشياء|كرات|حبات))?/i);
  if(groupsWord){const a=Number(groupsWord[1]),b=Number(groupsWord[2]),value=a*b;return{kind:"groups-multiplication",expectedAnswer:format(value),answer:`عندنا ${a} مجموعات، في كل مجموعة ${b} عناصر، إذن نضرب: ${a} × ${b} = ${format(value)}.`};}

  const shareWord = text.match(/(?:وزع|وزّع|وُزّع)\s+(\d+)\s+(?:عنصرًا|عنصرا|عنصر)[^\d]{0,30}(?:على|إلى)\s+(\d+)\s+مجموعات/i);
  if(shareWord){const total=Number(shareWord[1]),groups=Number(shareWord[2]),value=total/groups;return{kind:"sharing-division",expectedAnswer:format(value),answer:`نوزع ${total} بالتساوي على ${groups} مجموعات: ${total} ÷ ${groups} = ${format(value)}.`};}

  const groupsThenShare = text.match(/(?:في\s+)?(\d+)\s+صناديق[^\d]{0,30}(?:كل\s+صندوق|بكل\s+صندوق)[^\d]{0,10}(\d+)[^\d]{0,40}(?:بالتساوي|وزعت|وُزّعت)[^\d]{0,20}(\d+)\s+(?:طلاب|طالب)/i);
  if(groupsThenShare){const boxes=Number(groupsThenShare[1]),each=Number(groupsThenShare[2]),students=Number(groupsThenShare[3]),total=boxes*each,value=total/students;return{kind:"multiply-then-divide-word",expectedAnswer:format(value),answer:`أولًا نحسب عدد الأقلام كلها: ${boxes} × ${each} = ${format(total)}. ثم نوزعها بالتساوي على ${students}: ${format(total)} ÷ ${students} = ${format(value)}. إذن لكل طالب ${format(value)} قلمًا.`};}

  const percentIncrease = text.match(/(?:سعر|ثمن)[^\d]{0,10}(\d+(?:\.\d+)?)\s+[^%]{0,25}(?:زاد|زيادة)\s+(\d+(?:\.\d+)?)%/i);
  if(percentIncrease){const base=Number(percentIncrease[1]),p=Number(percentIncrease[2]),inc=base*p/100,value=base+inc;return{kind:"percent-increase",expectedAnswer:format(value),answer:`نحسب مقدار الزيادة أولًا: ${p}% من ${base} = ${format(inc)}. ثم نضيف الزيادة إلى السعر الأصلي: ${base} + ${format(inc)} = ${format(value)}. إذن السعر الجديد ${format(value)}.`};}

  const bothSides = text.match(/(-?\d+(?:\.\d+)?)\s*(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:س|x)\s*([+\-])\s*(-?\d+(?:\.\d+)?)/i);
  if(bothSides){const a=Number(bothSides[1]),b=(bothSides[2]==="+"?1:-1)*Number(bothSides[3]),c=Number(bothSides[4]),d=(bothSides[5]==="+"?1:-1)*Number(bothSides[6]);if(a!==c){const x=(d-b)/(a-c);return{kind:"linear-equation-both-sides",expectedAnswer:format(x),answer:`نجمع حدود المجهول في طرف والثوابت في الطرف الآخر: (${a} - ${c})س = ${format(d-b)}. ثم نقسم على ${format(a-c)} فنحصل على س = ${format(x)}. ونتحقق بالتعويض في الطرفين.`};}}

  const fractionEquivalence = text.match(/هل\s+(\d+)\s*\/\s*(\d+)\s+و\s+(\d+)\s*\/\s*(\d+)\s+متكافئ/i);
  if(fractionEquivalence){const a=Number(fractionEquivalence[1]),b=Number(fractionEquivalence[2]),c=Number(fractionEquivalence[3]),d=Number(fractionEquivalence[4]);const equal=a*d===c*b;return{kind:"fraction-equivalence",expectedAnswer:equal?"متكافئان":"غير متكافئين",answer:equal?`نعم، الكسران متكافئان. نبسّط ${a}/${b} فنحصل على ${c}/${d}، أو نتحقق بالضرب التبادلي: ${a} × ${d} = ${c} × ${b}.`:`لا، الكسران غير متكافئين لأن الضرب التبادلي لا يعطي قيمتين متساويتين.`};}

  if(/(?:أثبت|اثبت)[^\n]{0,30}(?:كل\s+)?عدد\s+أولي\s+فردي/i.test(text))return{kind:"false-prime-parity-claim",expectedAnswer:"2",answer:"العبارة «كل عدد أولي فردي» غير صحيحة، لذلك لا يمكن إثباتها. يوجد مثال مضاد مباشر: العدد 2 أولي، لكنه زوجي. الصياغة الصحيحة هي: كل عدد أولي أكبر من 2 فردي؛ لأن أي عدد زوجي أكبر من 2 يقبل القسمة على 2، فلا يكون أوليًا."};

  const divisionByZero = text.match(/(-?\d+(?:\.\d+)?)\s*\/\s*0(?:\D|$)/);
  if (divisionByZero) return {kind:"division-by-zero",expectedAnswer:"غير معرّفة",answer:"القسمة على صفر غير معرّفة. لأننا لو افترضنا أن عددًا ما يساوي "+divisionByZero[1]+" ÷ 0، فسنحتاج عددًا إذا ضربناه في 0 يعطينا "+divisionByZero[1]+"، لكن أي عدد مضروبًا في 0 يساوي 0. لذلك لا يوجد ناتج لهذه القسمة."};

  const falseArithmeticPremise = text.match(/(?:لماذا|ليش|اشرح)[^\n]{0,40}(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)\s*(?:يساوي|=)\s*(-?\d+(?:\.\d+)?)/i);
  if(falseArithmeticPremise){const a=Number(falseArithmeticPremise[1]),op=falseArithmeticPremise[2],b=Number(falseArithmeticPremise[3]),claimed=Number(falseArithmeticPremise[4]);if(!(op==="/"&&b===0)){const actual=op==="+"?a+b:op==="-"?a-b:op==="*"?a*b:a/b;if(actual!==claimed)return{kind:"false-premise",expectedAnswer:format(actual),answer:`الفرضية غير صحيحة، لأننا نتحقق من العملية نفسها بدل افتراض النتيجة. ${a} ${op==="*"?"×":op==="/"?"÷":op} ${b} = ${format(actual)}، وليس ${claimed}. لذلك لا يمكن بناء شرح صحيح على النتيجة ${claimed}؛ أول خطوة هي تصحيح الفرضية إلى ${format(actual)}.`};}}
  const chain = text.match(/^\s*(-?\d+(?:\.\d+)?)\s*([+\-*/÷×])\s*(-?\d+(?:\.\d+)?)\s*([+\-*/÷×])\s*(-?\d+(?:\.\d+)?)/);
  if(chain){const a=Number(chain[1]),op1=chain[2],b=Number(chain[3]),op2=chain[4],c=Number(chain[5]);const norm=(o:string)=>o==="÷"?"/":o==="×"?"*":o;const x=norm(op1),y=norm(op2);const apply=(m:number,o:string,n:number)=>o==="+"?m+n:o==="-"?m-n:o==="*"?m*n:m/n;let value:number;if((y==="*"||y==="/")&&(x==="+"||x==="-"))value=apply(a,x,apply(b,y,c));else value=apply(apply(a,x,b),y,c);return{kind:"operation-chain",expectedAnswer:format(value),answer:`نراعي ترتيب العمليات، ومع الضرب والقسمة في المستوى نفسه نعمل من اليسار إلى اليمين. الناتج = ${format(value)}.`};}

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


import { semanticRouteV2 } from "../lib/ai/semantic-router-v2";

type Case = {
  message: string;
  expected: string;
  age?: number;
  noReveal?: boolean;
  mathExpression?: boolean;
  child?: boolean;
};

const cases: Case[] = [
  {message:"17 + 8",expected:"direct",mathExpression:true},
  {message:"١٧ + ٨",expected:"direct",mathExpression:true},
  {message:"١٢ ÷ ٣",expected:"direct",mathExpression:true},
  {message:"كم يساوي 9 × 7؟",expected:"direct",mathExpression:true},

  {message:"لا تقول لي الناتج، بس لمّح",expected:"hint",noReveal:true},
  {message:"أعطني تلميحًا فقط",expected:"hint",noReveal:true},
  {message:"لا تعطيني الإجابة، ساعدني أبدأ",expected:"hint",noReveal:true},
  {message:"بدون حل، كيف أبدأ؟",expected:"hint",noReveal:true},
  {message:"لا تحسبها لي؛ علمني كيف أبدأ",expected:"hint",noReveal:true},
  {message:"لا تقول لي الناتج.\nبس علمني أول خطوة",expected:"hint",noReveal:true},

  {message:"حلي صح؟",expected:"verify"},
  {message:"هل إجابتي صحيحة؟",expected:"verify"},
  {message:"راجع خطوات الحل اللي كتبتها",expected:"verify"},
  {message:"تأكد من حلي",expected:"verify"},

  {message:"أنا حسبت 2/3 + 1/3 = 3/6، وين الغلط؟",expected:"misconception"},
  {message:"أنا أعتقد 1/8 أكبر لأن 8 أكبر، صح؟",expected:"misconception"},
  {message:"أظن 1/9 أكبر من 1/3 لأن 9 أكبر، هل تفكيري صحيح؟",expected:"misconception"},
  {message:"أنا حسبت 8 × 7 = 54، وين الخطأ؟",expected:"misconception"},

  {message:"ما فهمت، اشرح بطريقة ثانية",expected:"reteach"},
  {message:"الشرح مو واضح، أبي طريقة ثانية",expected:"reteach"},
  {message:"وريني بالرسم بدل الكلام، ما فهمت",expected:"reteach"},
  {message:"ممكن تبسط الشرح أكثر؟",expected:"reteach"},
  {message:"ما استوعبت الفكرة، جرب مثال مختلف",expected:"reteach"},

  {message:"ليش المقام الأكبر يخلي 1/9 أصغر؟",expected:"concept"},
  {message:"وش معنى المحيط؟",expected:"concept"},
  {message:"فسر لي معنى المتغير",expected:"concept"},
  {message:"لماذا نطرح نفس العدد من طرفي المعادلة؟",expected:"concept"},
  {message:"ما الفرق بين المساحة والمحيط؟",expected:"concept"},

  {message:"المعطيات ما تكفي لجواب واحد، وش نسوي؟",expected:"epistemic"},
  {message:"هل للنمط أكثر من جواب؟",expected:"epistemic"},
  {message:"هل يمكن تحديد مساحة مستطيل إذا عرفنا طوله فقط؟",expected:"epistemic"},
  {message:"أقدر أجزم إن النمط هذا الوحيد؟",expected:"epistemic"},

  // طلب عدم كشف الإجابة يتقدم على التصحيح والتحقق.
  {message:"أنا حسبت 2/3 + 1/3 = 3/6، وين الغلط؟ لا تقول لي الناتج",
   expected:"hint",noReveal:true},
  {message:"حلي صح؟ لا تعطيني الحل، بس لمّح",
   expected:"hint",noReveal:true},

  // المقصود بالأطفال هنا: أقل من عشر سنوات.
  {message:"3 + 2",expected:"direct",age:8,child:true},
  {message:"3 + 2",expected:"direct",age:9,child:true},
  {message:"3 + 2",expected:"direct",age:10,child:false},
  {message:"3 + 2",expected:"direct",age:14,child:false},
];

let passed = 0;
const failures: object[] = [];
const groups: Record<string,{passed:number;total:number}> = {};

for (const [index,c] of cases.entries()) {
  const result = semanticRouteV2(c.message,c.age);
  const issues: string[] = [];

  if (result.intent !== c.expected)
    issues.push(`intent: expected=${c.expected}, actual=${result.intent}`);

  for (const key of ["noReveal","mathExpression","child"] as const) {
    if (c[key] !== undefined && result[key] !== c[key])
      issues.push(`${key}: expected=${c[key]}, actual=${result[key]}`);
  }

  const ok = issues.length === 0;
  passed += Number(ok);
  const group = groups[c.expected] ??= {passed:0,total:0};
  group.total++;
  group.passed += Number(ok);

  console.log(`[${index+1}/${cases.length}] ${ok?"PASS":"FAIL"} ${c.expected}`);

  if (!ok) {
    const failure = {message:c.message,age:c.age,issues,result};
    failures.push(failure);
    console.log(JSON.stringify(failure,null,2));
  }
}

console.log(JSON.stringify({
  suite:"semantic-router-expanded",
  passed,
  total:cases.length,
  rate:passed/cases.length,
  groups,
  failures
},null,2));

if (failures.length) process.exitCode = 1;

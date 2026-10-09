export type SemanticIntent="hint"|"concept"|"misconception"|"reteach"|"verify"|"epistemic"|"direct";
export type SemanticRoute={intent:SemanticIntent;confidence:number;noReveal:boolean;child:boolean;conceptual:boolean;misconception:boolean;epistemic:boolean;mathExpression:boolean;reasons:string[]};

export function semanticRouteV2(message:string,age?:number):SemanticRoute{
 const m=message.trim();const reasons:string[]=[];
 const noReveal=/تلميح|لمّح|لمح|دفعة\s+بسيطة/.test(m)||/(?:لا|ولا|بدون).*?(?:تحلها|تحسبها|تحله|تحسبه)/.test(m)||/(?:لا|ولا).*?(?:تقول|تعطيني|تكشف|تطلع|تظهر).*?(?:كم|الجواب|الحل|الناتج)/.test(m)||(/(?:لا|ولا|بدون)/.test(m)&&/(?:تعطيني|تقول|تكتب|تحل|تحسب|تكشف)/.test(m)&&/(?:جواب|حل|ناتج|قيمة)/.test(m));
 if(noReveal)reasons.push("explicit-no-reveal");
 const misconception=/(?:أنا\s+(?:أقول|حسبت|أعتقد|اظن|أظن)|وين|فين).*?(?:غلط|الخطأ|الخلل|الفكرة)|(?:صح\s+تفكيري|ليش\s+غلط)/.test(m);
 if(misconception)reasons.push("student-claim-or-misconception");
 const reteach=/(?:ما\s*فهمت|مو\s+واضح|غير\s+واضح|لخبط|طريقة\s+(?:ثانية|غير)|اشرح.*?(?:بطريقة|بشكل).*?(?:ثاني|مختلف)|(?:رسم|مجموعات|نقاط).*?(?:بدل|عوض))/.test(m);
 if(reteach)reasons.push("reteach-request");
 const epistemic=/(?:المعطيات|المعلومات|البيانات).*?(?:ما|مو|لا).*?(?:تكفي|كافية)|(?:أكثر|اكثر)\s+من\s+(?:جواب|حل|تفسير)|(?:أكيد|مؤكد|أجزم).*?(?:قاعدة|نمط|قانون)|(?:قاعدة|نمط|قانون).*?(?:وحيد|الوحيدة|أكيد|مؤكد)/.test(m);
 if(epistemic)reasons.push("epistemic-uncertainty");
 const conceptual=/(?:ليش|لماذا|ليه|معنى|يعني|اشرح|فسّر|فسر|وش\s+هو|إيش\s+هو|ايش\s+هو|الفرق|أفرق|افرق|أستفيد|استفيد|أستنتج|استنتج)/.test(m)||reteach||epistemic;
 if(conceptual)reasons.push("conceptual-language");
 const verify=/(?:حلي|إجابتي|اجابتي|حسبت).*?(?:صح|صحيح)|(?:صح|صحيح)\s*[؟?]?$/.test(m);
 if(verify)reasons.push("verify-student-work");
 const mathExpression=/(?:\d+\s*[+\-×*÷/]\s*\d+|\d+\s*\/\s*\d+|(?:س|x)\s*[+\-=]|\d+\s*(?:س|x))/i.test(m);
 if(mathExpression)reasons.push("explicit-math-expression");
 let intent:SemanticIntent="direct",confidence=.7;
 if(noReveal){intent="hint";confidence=.99}
 else if(verify){intent="verify";confidence=.97}
 else if(misconception){intent="misconception";confidence=.96}
 else if(reteach){intent="reteach";confidence=.96}
 else if(epistemic){intent="epistemic";confidence=.95}
 else if(conceptual){intent="concept";confidence=.9}
 return{intent,confidence,noReveal,child:(age??99)<=10,conceptual,misconception,epistemic,mathExpression,reasons};
}

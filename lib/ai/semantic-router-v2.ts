export type SemanticIntent="hint"|"concept"|"misconception"|"reteach"|"verify"|"epistemic"|"direct";
export type SemanticRoute={intent:SemanticIntent;confidence:number;noReveal:boolean;child:boolean;conceptual:boolean;misconception:boolean;epistemic:boolean;mathExpression:boolean;reasons:string[]};

export function semanticRouteV2(message:string,age?:number):SemanticRoute{
 const m=message
   .normalize("NFKC")
   .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
   .replace(/[أإآ]/g,"ا")
   .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660))
   .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06F0))
   .replace(/\s+/g," ")
   .trim();
 const reasons:string[]=[];
 const token=(pattern:string)=>new RegExp(
   "(?:^|[^\\u0621-\\u064A\\u066E-\\u06D3A-Za-z0-9_])(?:"+pattern+")(?=$|[^\\u0621-\\u064A\\u066E-\\u06D3A-Za-z0-9_])"
 );
 const noReveal=
   token("تلميح(?:ا)?|لمح|لمحلي").test(m) ||
   token("(?:لا|ولا)\\s+(?:تقول|تعطيني|تكشف|تطلع|تظهر|تكتب)(?:\\s+لي)?\\s+(?:كم|الجواب|الاجابة|الحل|الناتج|القيمة)").test(m) ||
   token("(?:لا|ولا)\\s+(?:تحلها|تحسبها|تحله|تحسبه|تحسب|تحل)(?:\\s+لي)?").test(m) ||
   token("بدون\\s+(?:الحل|حل|الجواب|جواب|الاجابة|اجابة|الناتج|ناتج)").test(m) ||
   token("دفعة\\s+بسيطة").test(m);
 if(noReveal)reasons.push("explicit-no-reveal");
 const misconception=
   /(?:انا\s+(?:اقول|حسبت|اعتقد|اظن)|وين|فين).*?(?:غلط|الخطا|الخلل|الفكرة)/.test(m) ||
   /(?:صح\s+تفكيري|ليش\s+غلط)/.test(m) ||
   /(?:انا\s+)?(?:اعتقد|اظن).*?(?:اكبر|اصغر|يساوي|متساوي).*?(?:لان|بسبب)/.test(m);
 if(misconception)reasons.push("student-claim-or-misconception");
 const reteach=
   /(?:ما\s*(?:فهمت|استوعبت)|مو\s+واضح|غير\s+واضح|لخبط|طريقة\s+(?:ثانية|غير)|اشرح.*?(?:بطريقة|بشكل).*?(?:ثاني|مختلف)|(?:رسم|مجموعات|نقاط).*?(?:بدل|عوض))/.test(m) ||
   /(?:بسط|تبسط|بسطي|تبسيط).*?(?:الشرح|الفكرة|الموضوع)/.test(m) ||
   /(?:جرب|اعطني|هات).*?مثال\s+(?:مختلف|ثاني|اخر)/.test(m);
 if(reteach)reasons.push("reteach-request");
 const epistemic=
   /(?:المعطيات|المعلومات|البيانات).*?(?:ما|مو|لا).*?(?:تكفي|كافية)/.test(m) ||
   /(?:اكثر)\s+من\s+(?:جواب|حل|تفسير)/.test(m) ||
   /(?:اكيد|مؤكد|اجزم).*?(?:قاعدة|نمط|قانون)/.test(m) ||
   /(?:قاعدة|نمط|قانون).*?(?:وحيد|الوحيدة|اكيد|مؤكد)/.test(m) ||
   /(?:هل|يمكن|اقدر).*?(?:تحديد|حساب|احسب|اعرف).*?مساحة.*?مستطيل.*?(?:طوله|عرضه)\s+فقط/.test(m);
 if(epistemic)reasons.push("epistemic-uncertainty");
 const conceptual=
   /(?:ليش|لماذا|ليه|معنى|يعني|اشرح|فسر|وش\s+هو|ايش\s+هو|الفرق|افرق|استفيد|استنتج)/.test(m) ||
   reteach || epistemic;
 if(conceptual)reasons.push("conceptual-language");
 const verify=
   /(?:حلي|اجابتي|حسبت).*?(?:صح|صحيح)/.test(m) ||
   /(?:صح|صحيح)\s*[؟?]?$/.test(m) ||
   /(?:راجع|تحقق|تاكد|دقق).*?(?:حلي|اجابتي|خطوات|الحل|الحساب)/.test(m);
 if(verify)reasons.push("verify-student-work");
 const mathExpression=/(?:\d+\s*[+\-×*÷/]\s*\d+|\d+\s*\/\s*\d+|(?:س|x)\s*[+\-=]|\d+\s*(?:س|x))/i.test(m);
 if(mathExpression)reasons.push("explicit-math-expression");
 let intent:SemanticIntent="direct",confidence=.7;
 if(noReveal){intent="hint";confidence=.99}
 else if(misconception){intent="misconception";confidence=.96}
 else if(verify){intent="verify";confidence=.97}
 else if(reteach){intent="reteach";confidence=.96}
 else if(epistemic){intent="epistemic";confidence=.95}
 else if(conceptual){intent="concept";confidence=.9}
 return{intent,confidence,noReveal,child:(age??99)<10,conceptual,misconception,epistemic,mathExpression,reasons};
}

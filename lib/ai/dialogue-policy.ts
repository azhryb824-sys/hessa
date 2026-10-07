import type{ConversationTurn,StudentState}from"./types";
export type DialogueMode="SOCRATIC_HINT"|"VERIFY_STUDENT_WORK"|"CONCEPT_EXPLANATION"|"RETEACH"|"SUPPORT_AND_DIAGNOSE"|"DIRECT_SOLUTION";
export type DialoguePlan={mode:DialogueMode;resolvedMessage:string;priorContext:string;shouldRevealAnswer:boolean;shouldCheckUnderstanding:boolean;instructions:string[]};
export function planDialogue(message:string,history:ConversationTurn[]=[],student:StudentState={}):DialoguePlan{
 const prior=history.slice(-6);const lastAssistant=[...prior].reverse().find(x=>x.role==="assistant")?.content??"";const lastUser=[...prior].reverse().find(x=>x.role==="user")?.content??"";const anchorUser=[...prior].reverse().find(x=>x.role==="user"&&/(?:\d\s*[+\-×*÷/=]|\d\s*س|كسر|مثلث|مساح|ضرب|قسمة)/i.test(x.content))?.content??lastUser;
 let mode:DialogueMode="DIRECT_SOLUTION";
 if(/(?:لا|بدون\s+ما)\s*(?:تعطيني|تقول|تكتب).*?(?:جواب|حل|ناتج|قيمة)|تلميح|ساعدني\s+أفهم/i.test(message))mode="SOCRATIC_HINT";
 else if(/(?:حلي|حسبت|إجابتي|اجابتي).*?(?:صح|صحيح)|صح[؟?]?$|(?:أول|اول|الخطوة|أبدأ|ابدأ).*?(?:أطرح|اطرح|أضيف|اضيف|أقسم|اقسم|أضرب|اضرب).*?[؟?]?$/i.test(message))mode="VERIFY_STUDENT_WORK";
 else if(/ليش|لماذا|سبب|ليه/.test(message))mode="CONCEPT_EXPLANATION";
 else if(/ما\s*فهمت|لم\s*أفهم|طريقة\s+ثانية|بطريقة\s+ثانية|وضحها|الخطوة/.test(message))mode="RETEACH";
 else if(/دايم\s+أغلط|دائم.*أخط|صعب|صعبة|مو\s+فاهم/.test(message))mode="SUPPORT_AND_DIAGNOSE";
 const priorNoReveal=prior.some(x=>x.role==="user"&&/لا\s+(?:تعطيني|تقول|تكتب).*?(?:جواب|حل|ناتج)|بدون\s+ما\s+(?:تعطيني|تقول).*?(?:قيمة|حل|ناتج)/i.test(x.content));const followUp=history.length>0&&mode!=="DIRECT_SOLUTION";const referential=(mode==="RETEACH"||followUp)&&lastAssistant;const resolvedMessage=referential?`المسألة الأصلية للطالب: ${anchorUser}\nآخر رسالة للطالب: ${lastUser}\nشرح المعلم السابق: ${lastAssistant}\nطلب الطالب الآن: ${message}`:message;
 const instructions=[
 mode==="SOCRATIC_HINT"?"لا تكشف الناتج النهائي. أعط تلميحًا واحدًا ثم سؤالًا يجعل الطالب ينفذ الخطوة التالية.":"",
 mode==="VERIFY_STUDENT_WORK"?"ابدأ بحكم واضح على إجابة الطالب، ثم حدد موضع الخطأ إن وجد، ثم صحح السبب لا الرقم فقط.":"",
 mode==="CONCEPT_EXPLANATION"?"اشرح لماذا تعمل القاعدة باستخدام معنى أو تمثيل بصري/محسوس، لا تكرر القانون فقط.":"",
 mode==="RETEACH"?"لا تكرر الشرح السابق. غيّر التمثيل أو المثال أو زاوية الشرح مع الحفاظ على نفس المسألة.":"",
 mode==="SUPPORT_AND_DIAGNOSE"?"اعترف بصعوبة النقطة باختصار، ثم ابدأ بتشخيص صغير أو مثال بسيط قابل للإجابة.":"",
 student.age!==undefined&&student.age<=10?"استخدم جملًا قصيرة ومثالًا محسوسًا وسؤال متابعة واحدًا.":""
 ].filter(Boolean);
 return{mode,resolvedMessage,priorContext:prior.map(x=>`${x.role==="user"?"الطالب":"المعلم"}: ${x.content}`).join("\n"),shouldRevealAnswer:mode!=="SOCRATIC_HINT"&&!priorNoReveal,shouldCheckUnderstanding:["DIRECT_SOLUTION","CONCEPT_EXPLANATION","RETEACH"].includes(mode),instructions};
}
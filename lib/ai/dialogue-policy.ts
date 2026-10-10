import { semanticRouteV2 } from "./semantic-router-v2";
import type{ConversationTurn,StudentState}from"./types";
export type DialogueMode="SOCRATIC_HINT"|"VERIFY_STUDENT_WORK"|"CONCEPT_EXPLANATION"|"RETEACH"|"SUPPORT_AND_DIAGNOSE"|"PRACTICE_REQUEST"|"DIRECT_SOLUTION";
export type DialoguePlan={mode:DialogueMode;resolvedMessage:string;priorContext:string;shouldRevealAnswer:boolean;shouldCheckUnderstanding:boolean;instructions:string[]};
export function planDialogue(message:string,history:ConversationTurn[]=[],student:StudentState={}):DialoguePlan{
 const prior=history.slice(-6);const lastAssistant=[...prior].reverse().find(x=>x.role==="assistant")?.content??"";const lastUser=[...prior].reverse().find(x=>x.role==="user")?.content??"";const anchorUser=[...prior].reverse().find(x=>x.role==="user"&&/(?:\d\s*[+\-×*÷/=]|\d\s*س|كسر|مثلث|مساح|ضرب|قسمة)/i.test(x.content))?.content??lastUser;
 const semantic=semanticRouteV2(message,student.age);
 const explicitNoReveal=semantic.noReveal;
 let mode:DialogueMode="DIRECT_SOLUTION";
 if(explicitNoReveal||/ساعدني\s+أفهم/i.test(message))mode="SOCRATIC_HINT";
 else if(/(?:حلي|حسبت|إجابتي|اجابتي).*?(?:صح|صحيح)|صح[؟?]?$|(?:أول|اول|الخطوة|أبدأ|ابدأ).*?(?:أطرح|اطرح|أضيف|اضيف|أقسم|اقسم|أضرب|اضرب).*?[؟?]?$|يعني\s+(?:أجمع|اجمع|أطرح|اطرح|أضرب|اضرب|أقسم|اقسم).*?[؟?]?$/i.test(message))mode="VERIFY_STUDENT_WORK";
 else if(/(?:أعطني|اعطني|هات|عطني).*?(?:سؤال|مسألة).*?(?:جديد|أجرب|اجرب|بنفسي)|(?:سؤال|مسألة).*?(?:أجرب|اجرب).*?(?:بنفسي)?|اختبرني.*?(?:بسؤال|بمسألة).*?(?:مشابه|جديد)?/i.test(message))mode="PRACTICE_REQUEST";
 else if(/ليش|لماذا|سبب|ليه|إيش\s+(?:يعني|هو|معنى)|ايش\s+(?:يعني|هو|معنى)|وش\s+(?:يعني|هو|معنى)|(?:إيش|ايش|وش)\s+يعني\s+[سصعمنكله]\b|ما\s+معنى|اشرح(?:ها|ه)?\s+لي|أبي\s+أفهم|ابي\s+افهم|فرّق\s+لي|فرق\s+لي|إيش\s+الفرق|ايش\s+الفرق|وش\s+الفرق|كيف\s+أفرق|كيف\s+افرق/.test(message))mode="CONCEPT_EXPLANATION";
 else if(/ما\s*فهمت|لم\s*أفهم|طريقة\s+ثانية|بطريقة\s+ثانية|وضحها|الخطوة/.test(message))mode="RETEACH";
 else if(/دايم\s+أغلط|دائم.*أخط|صعب|صعبة|مو\s+فاهم/.test(message))mode="SUPPORT_AND_DIAGNOSE";

 // الموجّه الدلالي هو المرجع للتصنيفات المشتركة.
 if(semantic.intent==="hint")mode="SOCRATIC_HINT";
 else if(semantic.intent==="misconception")mode="VERIFY_STUDENT_WORK";
 else if(semantic.intent==="verify")mode="VERIFY_STUDENT_WORK";
 else if(semantic.intent==="reteach")mode="RETEACH";
 else if(semantic.intent==="concept"||semantic.intent==="epistemic")
   mode="CONCEPT_EXPLANATION";
 else if(mode==="SOCRATIC_HINT")mode="DIRECT_SOLUTION";

 const latestDirective=[...prior].reverse().find(turn=>
 turn.role==="user"&&(
  semanticRouteV2(turn.content).noReveal||isExplicitReveal(turn.content)
 ));
 const currentReveal=isExplicitReveal(message)&&!explicitNoReveal;
 const priorNoReveal=!currentReveal&&Boolean(
  latestDirective&&semanticRouteV2(latestDirective.content).noReveal
 );const followUp=history.length>0&&mode!=="DIRECT_SOLUTION";const referential=(mode==="RETEACH"||followUp)&&lastAssistant;const resolvedMessage=referential?`المسألة الأصلية للطالب: ${anchorUser}\nآخر رسالة للطالب: ${lastUser}\nشرح المعلم السابق: ${lastAssistant}\nطلب الطالب الآن: ${message}`:message;
 const instructions=[
 semantic.epistemic?"حدد المعطيات الناقصة صراحة. لا تفترض قيمًا غير مذكورة، وميّز الأمثلة الافتراضية عن معطيات السؤال.":"",

 mode==="SOCRATIC_HINT"?"لا تكشف الناتج النهائي. أعط تلميحًا واحدًا ثم سؤالًا يجعل الطالب ينفذ الخطوة التالية.":"",
 mode==="VERIFY_STUDENT_WORK"?"إذا أرسل الطالب حله فراجعه وحدد الخطأ وسببه. إذا لم يرسل السؤال أو خطوات الحل، اطلبهما مباشرة دون تخمين أو سؤال عن موضوع آخر.":"",
 mode==="CONCEPT_EXPLANATION"?"اشرح لماذا تعمل القاعدة باستخدام معنى أو تمثيل بصري/محسوس، لا تكرر القانون فقط.":"",
 mode==="RETEACH"?"لا تكرر الشرح السابق. غيّر التمثيل أو المثال أو زاوية الشرح مع الحفاظ على نفس المسألة.":"",
 mode==="SUPPORT_AND_DIAGNOSE"?"اعترف بصعوبة النقطة باختصار، ثم ابدأ بتشخيص صغير أو مثال بسيط قابل للإجابة.":"",
 mode==="PRACTICE_REQUEST"?"أعط سؤالًا جديدًا صغيرًا على نفس المهارة دون ذكر الحل، ثم انتظر إجابة الطالب.":"",
 student.age!==undefined&&student.age<10?"استخدم جملًا قصيرة ومثالًا محسوسًا وسؤال متابعة واحدًا.":""
 ].filter(Boolean);
 return{mode,resolvedMessage,priorContext:prior.map(x=>`${x.role==="user"?"الطالب":"المعلم"}: ${x.content}`).join("\n"),shouldRevealAnswer:!explicitNoReveal&&mode!=="SOCRATIC_HINT"&&!priorNoReveal,shouldCheckUnderstanding:["DIRECT_SOLUTION","CONCEPT_EXPLANATION","RETEACH"].includes(mode),instructions};
}

function isExplicitReveal(message:string){
 const text=message.replace(/[\u064B-\u065F\u0670\u0640]/g,"")
  .replace(/[أإآ]/g,"ا");
 return /(?:اعطني|عطني|اريد|ابغى|ابي)\s+(?:الحل|الجواب|الاجابة|الناتج)/.test(text);
}

export function evaluateGenerativeQuality(answer:string){const issues:string[]=[];const t=answer.trim();if(t.split(/\s+/).filter(Boolean).length>180)issues.push("OVERLONG");if((t.match(/(?:ممتاز|رائع|أحسنت|ذكي|عبقري|مبدع)/g)||[]).length>1)issues.push("EXCESSIVE_PRAISE");if((t.match(/(?:سؤال\s+تشخيصي|قبل\s+أن\s+نبدأ|قبل\s+ما\s+نبدأ)/g)||[]).length>1)issues.push("REPEATED_DIAGNOSTIC");if(/(?:السياق\s+المنهجي|تعليمات\s+النظام|system prompt|المحتوى\s+المسترجع)/i.test(t))issues.push("PROMPT_LEAKAGE");if(/أرسل\s+لي\s+سؤالًا\s+تشخيصيًا/.test(t))issues.push("ROLE_CONFUSION");
const normalized=t.replace(/[\u064B-\u065F\u0670\u0640]/g,"")
 .replace(/[أإآ]/g,"ا");
if((t.match(/\*\*/g)??[]).length%2!==0)
 issues.push("UNBALANCED_MARKDOWN");

const words=normalized
 .replace(/[،؛.!؟?:*\n]+/g," ")
 .split(/\s+/)
 .filter(Boolean)
 .map(word=>word.startsWith("ال")&&word.length>4?word.slice(2):word);

if(words.some((word,index)=>
 index>=2&&word.length>=2&&
 word===words[index-1]&&word===words[index-2]
))
 issues.push("REPEATED_WORD_LOOP");

if(/(?:الخطا\s+فيك|انت\s+غبي|انت\s+ما\s+تفهم)/.test(normalized))
 issues.push("STUDENT_BLAME");
if(/(?:اذا|لان|عرفنا|بحيث|ان)\s*$/.test(normalized))
 issues.push("POSSIBLE_INCOMPLETE_ENDING");
return{ok:issues.length===0,issues}
}

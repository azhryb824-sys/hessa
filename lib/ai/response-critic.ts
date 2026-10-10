import type{LearnerStage}from"./types";
export type Critique={pass:boolean;score:number;issues:string[]};
export function critiqueTutorAnswer(input:{message:string;answer:string;stage:LearnerStage;mode:string;verified:boolean;studentWorkAvailable?:boolean;previousAssistant?:string}):Critique{
 const issues:string[]=[];const a=input.answer.trim();
 if(a.length<12)issues.push("too-short");
 if(input.mode==="SOCRATIC_HINT"&&/الناتج (?:هو|=)|إذن.*\d/.test(a))issues.push("hint-reveals-answer");
 if(input.mode==="RETEACH"&&input.previousAssistant&&similarity(a,input.previousAssistant)>.72)issues.push("repeated-explanation");
 if((input.stage==="EARLY_CHILD"||input.stage==="PRIMARY")&&a.length>650)issues.push("too-long-for-stage");
 if(input.mode==="VERIFY_STUDENT_WORK"&&input.studentWorkAvailable!==false&&!/(غير صحيح|صحيح|خطأ|إجابتك)|^(?:نعم|لا)[،,:\s]/.test(a))issues.push("no-explicit-judgment");

 const normalized=a
  .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
  .replace(/[أإآ]/g,"ا");

 const explanationSignals=
  /(?:لان|السبب|يعني|تعني|تخيل|مثال|عشان كذا)/.test(normalized)||
  /(?:نفس|متساوي).*?(?:يختلف|تختلف|اختلف|يتغير|تتغير)/.test(normalized)||
  (/يمثل/.test(normalized)&&/(?:حول|داخل|يغطي|سياج|عشب)/.test(normalized));

 if(input.mode==="CONCEPT_EXPLANATION"&&!explanationSignals)
  issues.push("rule-without-why");

 if(!input.verified&&/بالتأكيد|مؤكد|الإجابة الصحيحة/.test(a))issues.push("overclaim-unverified");
 return{pass:issues.length===0,score:Math.max(0,1-issues.length*.22),issues};
}
function similarity(a:string,b:string){const x=new Set(tokens(a)),y=new Set(tokens(b));if(!x.size||!y.size)return 0;let n=0;for(const t of x)if(y.has(t))n++;return n/Math.max(x.size,y.size)}
function tokens(s:string){return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>2)}

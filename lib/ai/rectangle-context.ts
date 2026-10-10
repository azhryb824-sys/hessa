
import type { ConversationTurn, VerificationResult } from "./types";

function normalize(text:string){
 return text.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660))
  .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06F0))
  .replace(/[أإآ]/g,"ا");
}

export function resolveRectangleContext(
 message:string,history:ConversationTurn[],reveal:boolean
):{answer:string;verification:VerificationResult}|null{
 if(!reveal)return null;
 const current=normalize(message);
 if(/(?:مثلث|دائرة|مربع|جديد|جديدة|اخرى|اخر)/.test(current))return null;

 const users=history.filter(turn=>turn.role==="user").map(turn=>normalize(turn.content));
 const shapeIndex=users.map(text=>/(?:مستطيل|مستطيلة)/.test(text)).lastIndexOf(true);
 const currentRectangle=/(?:مستطيل|مستطيلة)/.test(current);
 if(!currentRectangle&&shapeIndex<0)return null;

 if(!/(?:طولها|عرضها|طوله|عرضه|الطول|العرض|الشريط|نفس|اللوحة|مساح|محيط)/.test(current))
  return null;

 const relevant=currentRectangle?[current]:[...users.slice(shapeIndex),current];
 if(relevant.some(text=>/(?:مثلث|دائرة|مربع|جديد|جديدة|اخرى|اخر)/.test(text)))
  return null;

 let length:number|undefined,width:number|undefined;
 let lengthUnit:string|undefined,widthUnit:string|undefined;
 for(const text of relevant){
  const l=text.match(/(?:طولها|طوله|الطول)\s*(?:=|يساوي|تساوي)?\s*(\d+(?:\.\d+)?)\s*(سم|متر|م)(?![\u0621-\u064AA-Za-z])/);
  const w=text.match(/(?:عرضها|عرضه|العرض)\s*(?:=|يساوي|تساوي)?\s*(\d+(?:\.\d+)?)\s*(سم|متر|م)(?![\u0621-\u064AA-Za-z])/);
  if(l){length=Number(l[1]);lengthUnit=l[2]==="سم"?"سم":"م";}
  if(w){width=Number(w[1]);widthUnit=w[2]==="سم"?"سم":"م";}
 }
 if(length===undefined||width===undefined||length<=0||width<=0||
    length>1000000||width>1000000||lengthUnit!==widthUnit)return null;


  const changeWords=/(?:ضاعف|ضعف|نصف|نص|زيد|زود|نقص|قلل|تغير|غيّر|غيرت|اطول|اقصر)/;
  const previousChanges=relevant.slice(0,-1).some(
    text=>changeWords.test(text)&&/(?:طول|عرض)/.test(text)
  );
  const explicitOriginal=/(?:الاصلي|الاصلية|الاصل|قبل التغيير)/.test(current);

  if(previousChanges&&!explicitOriginal){
    return {
      answer:"تقصد الأبعاد الأصلية للوحة، ولا الأبعاد بعد آخر تغيير؟ حدّد لي المرجع عشان أحسبها صح.",
      verification:{
        verified:false,confidence:0,
        method:"rectangle-reference-required",
        issues:["مرجع الأبعاد بعد التغييرات غير محدد."]
      }
    };
  }

  const changesCurrent=changeWords.test(current)&&/(?:طول|عرض)/.test(current);
  if(changesCurrent){
    if(!/ضاعف/.test(current)){
      return {
        answer:"وش الطول والعرض الجديدان، وبأي وحدة؟ أحتاج أحدد التغيير قبل حساب المساحة أو المحيط.",
        verification:{
          verified:false,confidence:0,
          method:"rectangle-change-required",
          issues:["نوع تغيير الأبعاد غير مدعوم حسابيًا في هذا المسار."]
        }
      };
    }
    // لا نطبّق قاعدة التضاعف على طلب يحتوي تغييرًا آخر.
    if(/(?:نصف|نقص|قلل|ثلاث|3|مرتين|مرات)/.test(current))return null;
    const doubleLength=/(?:ضاعفت|ضاعف|نضاعف|اضاعف)\s+(?:الطول|طولها|طوله)(?:\s|[،,.؟?]|$)/.test(current);
    const doubleWidth=/(?:ضاعفت|ضاعف|نضاعف|اضاعف)\s+(?:العرض|عرضها|عرضه)(?:\s|[،,.؟?]|$)/.test(current);
    const doubleBoth=/(?:ضاعفت|ضاعف|نضاعف|اضاعف)\s+(?:الطول\s*و\s*العرض|العرض\s*و\s*الطول)(?:\s|[،,.؟?]|$)/.test(current);

    if(!doubleLength&&!doubleWidth&&!doubleBoth){
      return {
        answer:"تقصد تضاعف الطول، ولا العرض، ولا الاثنين؟",
        verification:{
          verified:false,confidence:0,
          method:"rectangle-change-required",
          issues:["البعد المطلوب مضاعفته غير محدد."]
        }
      };
    }
    if(doubleLength||doubleBoth)length*=2;
    if(doubleWidth||doubleBoth)width*=2;
  }

  const area=/(?:مساح|اغطي|تغطية)/.test(current)||(changesCurrent&&!/(?:محيط|شريط|حواف|سياج)/.test(current)&&users.slice(shapeIndex).some(text=>/مساح/.test(text)));
 const perimeter=!area&&/(?:شريط|محيط|سياج|حواف)/.test(current);
 if(!area&&!perimeter)return null;

 const value=area?length*width:2*(length+width);
 const formatted=String(Number(value.toFixed(8)));
 return{
  answer:area
   ?`مساحة اللوحة = الطول × العرض = ${length} × ${width} = ${formatted} ${lengthUnit}².`
   :`طول الشريط يساوي محيط اللوحة: 2 × (الطول + العرض) = 2 × (${length} + ${width}) = ${formatted} ${lengthUnit}.`,
  verification:{
   verified:true,confidence:1,
   method:"contextual-rectangle-engine",
   expectedAnswer:formatted,issues:[]
  }
 };
}

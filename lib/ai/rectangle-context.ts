
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

 if(!/(?:طولها|عرضها|طوله|عرضه|الشريط|نفس|اللوحة|مساح|محيط)/.test(current))
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

 const area=/(?:مساح|اغطي|تغطية)/.test(current);
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

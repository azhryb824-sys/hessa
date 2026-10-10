export type LearningVisual={type:"groups"|"fraction-bar"|"number-line"|"rectangle"|"triangle";text:string};
export function buildLearningVisual(message:string):LearningVisual|null{
 message=message
  .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660))
  .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06F0));

 const mul=message.match(/(\d+)\s*[×*]\s*(\d+)/);if(mul){const rows=Number(mul[1]),cols=Number(mul[2]);if(rows<1||cols<1||rows>20||cols>20||rows*cols>100)return null;return{type:"groups",text:Array.from({length:rows},()=>Array.from({length:cols},()=>"●").join(" ")).join("\n")};}
 const fractions=[...message.matchAll(/(-?\d+)\s*\/\s*(-?\d+)/g)];const frac=fractions.length===1?fractions[0]:null;if(frac){const n=Number(frac[1]),d=Number(frac[2]);if(n>=0&&n<=d&&d>0&&d<=12)return{type:"fraction-bar",text:Array.from({length:d},(_,i)=>i<n?"■":"□").join(" ")};}
 if(/مثلث/.test(message))return{type:"triangle",text:"   /\\\n  /  \\\n /____\\\n القاعدة"};
 return null;
}
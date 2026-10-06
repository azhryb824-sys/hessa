export type LearningVisual={type:"groups"|"fraction-bar"|"number-line"|"rectangle"|"triangle";text:string};
export function buildLearningVisual(message:string):LearningVisual|null{
 const mul=message.match(/(\d+)\s*[×*]\s*(\d+)/);if(mul){const rows=Math.min(Number(mul[1]),6),cols=Math.min(Number(mul[2]),10);return{type:"groups",text:Array.from({length:rows},()=>Array.from({length:cols},()=>"●").join(" ")).join("\n")};}
 const frac=message.match(/(\d+)\s*\/\s*(\d+)/);if(frac){const n=Number(frac[1]),d=Number(frac[2]);if(d>0&&d<=12)return{type:"fraction-bar",text:Array.from({length:d},(_,i)=>i<n?"■":"□").join(" ")};}
 if(/مثلث/.test(message))return{type:"triangle",text:"   /\\\n  /  \\\n /____\\\n القاعدة"};
 return null;
}
export type MathFinding={expression:string;claimed:number;actual:number;ok:boolean};
const op=/(-?\d+(?:\.\d+)?)\s*([×x*+\-÷/])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/g;
function calc(a:number,o:string,b:number){if(o==="+")return a+b;if(o==="-")return a-b;if(o==="×"||o==="x"||o==="*")return a*b;if(o==="÷"||o==="/")return b===0?NaN:a/b;return NaN}
export function verifyExplicitArithmetic(text:string){const findings:MathFinding[]=[];for(const m of text.matchAll(op)){const a=Number(m[1]),b=Number(m[3]),claimed=Number(m[4]),actual=calc(a,m[2],b);findings.push({expression:m[0],claimed,actual,ok:Number.isFinite(actual)&&Math.abs(actual-claimed)<1e-9})}return{ok:findings.every(x=>x.ok),findings,errors:findings.filter(x=>!x.ok)}}

export type ChildGuardResult={answer:string;changed:boolean;issues:string[]};
export function enforceChildResponse(answer:string,age?:number):ChildGuardResult{
 if((age??99)>=10)return{answer,changed:false,issues:[]};
 const issues:string[]=[];let out=answer.trim();
 const words=out.split(/\s+/).filter(Boolean);
 if(words.length>85){issues.push("CHILD_OVERLONG");const sentences=out.split(/(?<=[.!؟])\s+/).filter(Boolean);out=sentences.slice(0,4).join(" ");if(out.split(/\s+/).length>85)out=out.split(/\s+/).slice(0,85).join(" ")+"."}
 if(/وش\s+المقصود|ما\s+المقصود/.test(out)&&/(?:يعني|معنى|اشرح|فسر|فسّر)/.test(out)){issues.push("UNNECESSARY_CLARIFICATION")}
 if(/(?:بالتأكيد|من الواضح|بالتالي|إذًا)[\s\S]*?(?:بالتأكيد|من الواضح|بالتالي|إذًا)/.test(out))issues.push("CHILD_DISCOURSE_COMPLEXITY");
 return{answer:out,changed:out!==answer.trim(),issues};
}

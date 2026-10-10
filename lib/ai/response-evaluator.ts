export type ResponseGrade={correctness:number;verification:number;pedagogy:number;ageFit:number;grounding:number;overall:number;failures:string[]};
export function gradeTutorResponse(input:{expected?:string;answer:string;verified:boolean;grounded:boolean;age?:number}):ResponseGrade{
 const failures:string[]=[];let correctness=.5;
 if(input.expected){const ok=input.answer.replace(/\s/g,"").includes(input.expected.replace(/\s/g,""));correctness=ok?1:0;if(!ok)failures.push("wrong-final-answer");}
 const verification=input.verified?1:(input.expected?.length?0:.5);if(input.expected&&verification===0)failures.push("unverified-supported-math");
 const sentences=input.answer.split(/[.!؟\n]+/).filter(Boolean);const avg=sentences.length?input.answer.length/sentences.length:input.answer.length;
 let ageFit=1;if((input.age??99)<=10&&avg>110){ageFit=.4;failures.push("too-verbose-for-child");}
 let pedagogy=.8;if(/إذن|لأن|خطو|نحدد|نحل|نتحقق/.test(input.answer))pedagogy=1;else{pedagogy=.6;failures.push("weak-explanation");}
 const grounding=input.grounded?1:.6;
 const overall=correctness*.4+verification*.2+pedagogy*.2+ageFit*.1+grounding*.1;
 return{correctness,verification,pedagogy,ageFit,grounding,overall,failures};
}
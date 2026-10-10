export type GeneratedQuestion={id:string;skillId:string;difficulty:1|2|3;prompt:string;answer:string;variant:string};
function seeded(seed:number){let x=seed|0;return()=>{x=(x*1664525+1013904223)|0;return(x>>>0)/4294967296}}
export function generateMathQuestions(skillId:string,count:number,seed=1):GeneratedQuestion[]{const rnd=seeded(seed);const out:GeneratedQuestion[]=[];for(let i=0;i<count;i++){const difficulty=((i%3)+1) as 1|2|3;let prompt="",answer="",variant="symbolic";const n=(max:number,min=1)=>Math.floor(rnd()*(max-min+1))+min;
 if(skillId==="g1-add-10"){const a=n(5),b=n(10-a);prompt=difficulty===3?`مع نورة ${a} أقلام ثم حصلت على ${b} أقلام. كم أصبح معها؟`:`${a} + ${b}`;answer=String(a+b);variant=difficulty===3?"word":"symbolic";}
 else if(skillId==="g1-sub-10"){const a=n(10,2),b=n(a-1);prompt=difficulty===3?`لدى سالم ${a} كرات وأعطى ${b}. كم بقي؟`:`${a} - ${b}`;answer=String(a-b);variant=difficulty===3?"word":"symbolic";}
 else if(skillId==="g3-multiply"){const a=n(10,2),b=n(10,2);prompt=difficulty===3?`${a} مجموعات، في كل مجموعة ${b} عناصر. كم عنصرًا؟`:`${a} × ${b}`;answer=String(a*b);variant=difficulty===3?"groups":"symbolic";}
 else if(skillId==="g3-division"){const b=n(9,2),q=n(9,2),a=b*q;prompt=difficulty===3?`وزع ${a} عنصرًا بالتساوي على ${b} مجموعات. كم في كل مجموعة؟`:`${a} ÷ ${b}`;answer=String(q);variant=difficulty===3?"sharing":"symbolic";}
 else if(skillId==="g6-ratios"){const base=n(20,2)*5,p=[10,20,25,50][n(3,0)];prompt=`${p}% من ${base}`;answer=String(p*base/100);variant="percentage";}
 else if(skillId==="g6-algebra"){const x=n(12,1),a=difficulty===1?1:n(4,2),b=n(9,1),c=a*x+b;prompt=a===1?`س + ${b} = ${c}`:`${a}س + ${b} = ${c}`;answer=String(x);variant="equation";}
 else continue;
 out.push({id:`${skillId}-${seed}-${i}`,skillId,difficulty,prompt,answer,variant});}return out;}

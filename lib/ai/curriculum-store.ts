import { prisma } from "@/lib/db/prisma";
import type { RetrievalDocument } from "./types";

function terms(value:string){return value.toLowerCase().replace(/[إأآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>1);}

export async function searchCurriculum(query:string, subject?:string, grade?:string, limit=6):Promise<RetrievalDocument[]> {
  const rows=await prisma.curriculumChunk.findMany({where:{reviewed:true,...(subject?{subject}:{}),...(grade?{grade}:{})},take:200,orderBy:{updatedAt:"desc"}});
  const q=new Set(terms(query));
  return rows.map(row=>{const hay=new Set(terms(`${row.title} ${row.unit??""} ${row.lesson??""} ${row.content}`));let score=0;for(const t of q)if(hay.has(t))score+=2;return{row,score};})
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit)
    .map(({row})=>({id:row.id,title:row.title,content:row.content,subject:row.subject,grade:row.grade,source:row.source??`MOE:${row.version}`}));
}

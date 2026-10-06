import { prisma } from "../lib/db/prisma";
import fs from "node:fs";
type InputChunk={id:string;title:string;content:string;subject:string;stage:string;grade:string;semester?:string;unit?:string;lesson?:string;source?:string;version:string;reviewed?:boolean;reviewerId?:string};
const file=process.argv[2];
if(!file) throw new Error("Provide a curriculum JSON file path.");
const data=JSON.parse(fs.readFileSync(file,"utf8")) as InputChunk[];
for(const chunk of data){
 if(!chunk.id||!chunk.title||!chunk.content||!chunk.subject||!chunk.stage||!chunk.grade||!chunk.version) throw new Error("Invalid curriculum chunk.");
 await prisma.curriculumChunk.upsert({where:{id:chunk.id},update:{...chunk,reviewed:chunk.reviewed??false},create:{...chunk,reviewed:chunk.reviewed??false}});
}
console.log("Imported curriculum chunks:",data.length);
await prisma.$disconnect();

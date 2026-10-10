import graph from "@/data/curriculum/hessa-math-primary-v1.json";
import { getUnlockedSkills } from "@/lib/ai/curriculum-graph";
import { NextResponse } from "next/server";
export async function POST(request:Request){const body=await request.json() as {masteredSkillIds?:string[]};const mastered=new Set(body.masteredSkillIds??[]);const unlocked=getUnlockedSkills(graph as never,mastered);return NextResponse.json({success:true,curriculum:"hessa-math-primary",version:"1.0.0",unlocked});}

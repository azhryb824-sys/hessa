import packs from "@/data/curriculum/hessa-math-primary-teaching-packs-v1.json";
import { NextResponse } from "next/server";
export async function GET(request:Request){
 const url=new URL(request.url); const skillId=url.searchParams.get("skillId");
 if(!skillId)return NextResponse.json({success:false,message:"skillId is required"},{status:400});
 const pack=packs.find(p=>p.id===skillId);
 if(!pack)return NextResponse.json({success:false,message:"Teaching pack not found"},{status:404});
 return NextResponse.json({success:true,version:"1.0.0",pack},{headers:{"Cache-Control":"public, max-age=300"}});
}

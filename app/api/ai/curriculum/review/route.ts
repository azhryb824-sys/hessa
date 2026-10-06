import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(request:Request){
 try{
  const body=await request.json() as {id:string;reviewed:boolean;reviewerId?:string};
  if(!body.id) return NextResponse.json({success:false,message:"id is required"},{status:400});
  if(body.reviewed&&!body.reviewerId) return NextResponse.json({success:false,message:"reviewerId is required to approve curriculum"},{status:400});
  const reviewer=body.reviewerId?await prisma.user.findUnique({where:{id:body.reviewerId}}):null;
  if(body.reviewed&&(!reviewer||reviewer.role!=="ADMIN")) return NextResponse.json({success:false,message:"Only ADMIN can approve curriculum chunks"},{status:403});
  const chunk=await prisma.curriculumChunk.update({where:{id:body.id},data:{reviewed:body.reviewed,reviewerId:body.reviewed?body.reviewerId:null}});
  return NextResponse.json({success:true,chunk});
 }catch(error){return NextResponse.json({success:false,message:error instanceof Error?error.message:"Review failed"},{status:400});}
}

import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";
function digest(v:string){return createHash("sha256").update(v).digest("hex");}
export async function POST(request:Request){try{const {email,password}=await request.json() as {email?:string;password?:string};if(!email||!password)return NextResponse.json({success:false,message:"البريد وكلمة المرور مطلوبان"},{status:400});const user=await prisma.user.findUnique({where:{email:email.trim().toLowerCase()}});if(!user)return NextResponse.json({success:false,message:"بيانات الدخول غير صحيحة"},{status:401});const a=digest(password),b=user.password;const valid=b.length===a.length&&timingSafeEqual(Buffer.from(b),Buffer.from(a));if(!valid)return NextResponse.json({success:false,message:"بيانات الدخول غير صحيحة"},{status:401});await createSession(user.id);return NextResponse.json({success:true,user:{id:user.id,name:user.name,role:user.role}});}catch(error){return NextResponse.json({success:false,message:error instanceof Error?error.message:"تعذر تسجيل الدخول"},{status:500});}}

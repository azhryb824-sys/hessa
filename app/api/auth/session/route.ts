import { clearSession, getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({success:false,message:"غير مسجل"},{status:401});return NextResponse.json({success:true,user:{id:user.id,name:user.name,email:user.email,role:user.role}});}
export async function DELETE(){await clearSession();return NextResponse.json({success:true});}
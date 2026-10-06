import { requireStudent } from "@/lib/auth/session";
import { getEntitlement } from "@/lib/billing/entitlement";
import { NextResponse } from "next/server";
export async function GET(){try{const user=await requireStudent();const entitlement=await getEntitlement(user.id);return NextResponse.json({success:true,entitlement});}catch{return NextResponse.json({success:false,message:"غير مصرح"},{status:401});}}
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get("subject");
    const orderParam = searchParams.get("order");

    if (!subject || !orderParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject and order are required",
        },
        { status: 400 }
      );
    }

    const order = Number(orderParam);

    if (!Number.isInteger(order) || order < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lesson order",
        },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        order,
        course: {
          subject,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          message: "Lesson not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson,
    });
  } catch (error) {
    console.error("Lesson details API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load lesson",
      },
      { status: 500 }
    );
  }
}
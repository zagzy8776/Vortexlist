import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Please sign in to contact support." }, { status: 401 });
  }

  const body = (await request.json()) as { subject?: string; message?: string };
  const subject = body.subject?.trim();
  const message = body.message?.trim();

  if (!subject || subject.length < 4 || subject.length > 120) {
    return NextResponse.json({ message: "Subject must be between 4 and 120 characters." }, { status: 400 });
  }

  if (!message || message.length < 10 || message.length > 2000) {
    return NextResponse.json({ message: "Message must be between 10 and 2000 characters." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject,
      message,
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({ ticketId: ticket.id }, { status: 201 });
}
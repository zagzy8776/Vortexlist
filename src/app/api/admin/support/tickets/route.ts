import { SupportTicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { ticketId?: string; status?: string; adminNote?: string };
  const ticketId = body.ticketId?.trim();
  const status = body.status?.trim() as SupportTicketStatus | undefined;
  const adminNote = body.adminNote?.trim() || null;

  if (!ticketId) {
    return NextResponse.json({ message: "Ticket is required." }, { status: 400 });
  }

  if (!status || !Object.values(SupportTicketStatus).includes(status)) {
    return NextResponse.json({ message: "Valid status is required." }, { status: 400 });
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      adminNote,
    },
  });

  return NextResponse.json({ ok: true });
}
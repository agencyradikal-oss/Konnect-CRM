"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { LeadStatus, DealStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";

// Toda mutación CRM verifica que el recurso pertenezca al businessId de la sesión.

const leadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.nativeEnum(LeadStatus),
});

export async function updateLeadStatus(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const data = leadStatusSchema.parse(input);

  const { count } = await prisma.lead.updateMany({
    where: { id: data.leadId, businessId },
    data: { status: data.status },
  });
  if (count === 0) return { ok: false as const, error: "Lead no encontrado." };

  revalidatePath("/app/leads");
  return { ok: true as const };
}

/** Convierte un Lead en Contact + Deal (marca CONVERTED). */
export async function convertLead(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const { leadId } = z.object({ leadId: z.string().min(1) }).parse(input);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, businessId } });
  if (!lead) return { ok: false as const, error: "Lead no encontrado." };

  await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: {
        businessId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
      },
    });
    const deal = await tx.deal.create({
      data: {
        businessId,
        contactId: contact.id,
        title: `Oportunidad — ${lead.name}`,
        stage: DealStage.NUEVO,
      },
    });
    await tx.activity.create({
      data: {
        businessId,
        dealId: deal.id,
        type: "created",
        content: `Creado desde lead (${lead.source}).`,
      },
    });
    await tx.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.CONVERTED, contactId: contact.id, dealId: deal.id },
    });
  });

  revalidatePath("/app/leads");
  revalidatePath("/app/deals");
  return { ok: true as const };
}

const dealStageSchema = z.object({
  dealId: z.string().min(1),
  stage: z.nativeEnum(DealStage),
});

export async function updateDealStage(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const data = dealStageSchema.parse(input);

  const deal = await prisma.deal.findFirst({
    where: { id: data.dealId, businessId },
  });
  if (!deal) return { ok: false as const, error: "Deal no encontrado." };

  await prisma.$transaction([
    prisma.deal.update({ where: { id: deal.id }, data: { stage: data.stage } }),
    prisma.activity.create({
      data: {
        businessId,
        dealId: deal.id,
        type: "stage_change",
        content: `Etapa: ${deal.stage} → ${data.stage}`,
      },
    }),
  ]);

  revalidatePath("/app/deals");
  return { ok: true as const };
}

export async function toggleTask(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const { taskId } = z.object({ taskId: z.string().min(1) }).parse(input);

  const task = await prisma.task.findFirst({ where: { id: taskId, businessId } });
  if (!task) return { ok: false as const, error: "Tarea no encontrada." };

  await prisma.task.update({ where: { id: task.id }, data: { done: !task.done } });
  revalidatePath("/app/tareas");
  return { ok: true as const };
}

const taskSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  dueDate: z.string().optional().or(z.literal("")),
});

export async function createTask(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const data = taskSchema.parse(input);

  await prisma.task.create({
    data: {
      businessId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath("/app/tareas");
  return { ok: true as const };
}

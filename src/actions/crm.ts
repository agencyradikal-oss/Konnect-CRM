"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { LeadStatus, DealStage, LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";

function revalidateCrm(...extra: string[]) {
  revalidatePath("/app", "layout");
  revalidatePath("/app/dashboard");
  for (const path of extra) revalidatePath(path);
}

const leadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.nativeEnum(LeadStatus),
});

export async function updateLeadStatus(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = leadStatusSchema.parse(input);

  const { count } = await prisma.lead.updateMany({
    where: { id: data.leadId, businessId },
    data: { status: data.status },
  });
  if (count === 0) return { ok: false as const, error: "Lead no encontrado." };

  revalidateCrm("/app/leads");
  return { ok: true as const };
}

/** Convierte un Lead en Contact + Deal (marca CONVERTED). */
export async function convertLead(input: unknown) {
  const { businessId } = await getCurrentBusiness();
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
        title: `Solicitud de ${lead.name}`,
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
      data: {
        status: LeadStatus.CONVERTED,
        contactId: contact.id,
        dealId: deal.id,
      },
    });
  });

  revalidateCrm("/app/leads", "/app/deals", "/app/contactos");
  return { ok: true as const };
}

const dealStageSchema = z.object({
  dealId: z.string().min(1),
  stage: z.nativeEnum(DealStage),
});

export async function updateDealStage(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = dealStageSchema.parse(input);

  const deal = await prisma.deal.findFirst({
    where: { id: data.dealId, businessId },
  });
  if (!deal) return { ok: false as const, error: "Deal no encontrado." };
  if (deal.stage === data.stage) return { ok: true as const };

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

  revalidateCrm("/app/deals");
  return { ok: true as const };
}

const dealUpdateSchema = z.object({
  dealId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  value: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  expectedClose: z.string().optional().nullable(),
});

export async function updateDeal(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = dealUpdateSchema.parse(input);

  const deal = await prisma.deal.findFirst({
    where: { id: data.dealId, businessId },
  });
  if (!deal) return { ok: false as const, error: "Deal no encontrado." };

  const value =
    data.value === undefined || data.value === null || data.value === ""
      ? data.value === undefined
        ? undefined
        : null
      : Number(data.value);

  await prisma.deal.update({
    where: { id: deal.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(value !== undefined && { value }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.expectedClose !== undefined && {
        expectedClose: data.expectedClose
          ? new Date(data.expectedClose)
          : null,
      }),
    },
  });

  revalidateCrm("/app/deals");
  return { ok: true as const };
}

const createDealSchema = z.object({
  contactId: z.string().min(1),
  title: z.string().min(1).max(200),
  value: z.union([z.string(), z.number()]).optional().or(z.literal("")),
});

export async function createDeal(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = createDealSchema.parse(input);

  const contact = await prisma.contact.findFirst({
    where: { id: data.contactId, businessId },
  });
  if (!contact) return { ok: false as const, error: "Contacto no encontrado." };

  const deal = await prisma.deal.create({
    data: {
      businessId,
      contactId: contact.id,
      title: data.title,
      value: data.value ? Number(data.value) : null,
      stage: DealStage.NUEVO,
    },
  });

  await prisma.activity.create({
    data: {
      businessId,
      dealId: deal.id,
      type: "created",
      content: "Deal creado manualmente.",
    },
  });

  revalidateCrm("/app/deals", "/app/contactos");
  return { ok: true as const, dealId: deal.id };
}

const activitySchema = z.object({
  dealId: z.string().min(1),
  type: z.enum(["note", "call"]),
  content: z.string().min(1).max(5000),
});

export async function addDealActivity(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = activitySchema.parse(input);

  const deal = await prisma.deal.findFirst({
    where: { id: data.dealId, businessId },
  });
  if (!deal) return { ok: false as const, error: "Deal no encontrado." };

  await prisma.activity.create({
    data: {
      businessId,
      dealId: deal.id,
      type: data.type,
      content: data.content,
    },
  });

  revalidateCrm("/app/deals");
  return { ok: true as const };
}

export async function toggleTask(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const { taskId } = z.object({ taskId: z.string().min(1) }).parse(input);

  const task = await prisma.task.findFirst({
    where: { id: taskId, businessId },
  });
  if (!task) return { ok: false as const, error: "Tarea no encontrada." };

  await prisma.task.update({
    where: { id: task.id },
    data: { done: !task.done },
  });
  revalidateCrm("/app/tareas", "/app/deals", "/app/dashboard");
  return { ok: true as const };
}

const taskSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  dueDate: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
});

export async function createTask(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = taskSchema.parse(input);

  if (data.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: data.dealId, businessId },
    });
    if (!deal) return { ok: false as const, error: "Deal no encontrado." };
  }

  await prisma.task.create({
    data: {
      businessId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      dealId: data.dealId || null,
    },
  });

  revalidateCrm("/app/tareas", "/app/deals", "/app/dashboard");
  return { ok: true as const };
}

const contactSchema = z.object({
  contactId: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")), // comma-separated
});

export async function upsertContact(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = contactSchema.parse(input);
  const tags = data.tags
    ? data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const payload = {
    name: data.name.trim(),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    company: data.company?.trim() || null,
    notes: data.notes?.trim() || null,
    tags,
  };

  if (data.contactId) {
    const existing = await prisma.contact.findFirst({
      where: { id: data.contactId, businessId },
    });
    if (!existing) return { ok: false as const, error: "Contacto no encontrado." };
    await prisma.contact.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.contact.create({
      data: { businessId, ...payload },
    });
  }

  revalidateCrm("/app/contactos");
  return { ok: true as const };
}

const importRowSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

const importSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(500),
});

/** Importa CSV: crea Contact + Lead source=IMPORT por fila. */
export async function importContacts(input: unknown) {
  const { businessId } = await getCurrentBusiness();
  const data = importSchema.parse(input);

  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const row of data.rows) {
      const contact = await tx.contact.create({
        data: {
          businessId,
          name: row.name.trim(),
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          tags: ["importado"],
        },
      });
      await tx.lead.create({
        data: {
          businessId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          source: LeadSource.IMPORT,
          status: LeadStatus.NEW,
          contactId: contact.id,
          message: "Importado desde CSV",
        },
      });
      created += 1;
    }
  });

  revalidateCrm("/app/contactos", "/app/leads");
  return { ok: true as const, created };
}

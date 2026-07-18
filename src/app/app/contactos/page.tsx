import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { ContactsManager } from "@/components/crm/contacts-manager";

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { businessId, business } = await getCurrentBusiness();
  await searchParams; // reserved for future server-side search
  const canImportCsv = getPlanLimits(business.plan).csvImport;

  const contacts = await prisma.contact.findMany({
    where: { businessId },
    include: {
      deals: {
        select: { id: true, title: true, stage: true, value: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <ContactsManager
      canImportCsv={canImportCsv}
      contacts={contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        notes: c.notes,
        tags: c.tags,
        deals: c.deals.map((d) => ({
          id: d.id,
          title: d.title,
          stage: d.stage,
          value: d.value != null ? Number(d.value) : null,
        })),
      }))}
    />
  );
}

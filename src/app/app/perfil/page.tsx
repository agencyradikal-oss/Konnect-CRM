import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/tenant";
import { ProfileForm } from "@/components/crm/profile-form";
import { defaultHours, type WeekHours } from "@/components/business/hours-editor";

export default async function PerfilPage() {
  const { businessId } = await getCurrentBusiness();

  const [business, categories] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { nameEs: "asc" },
      select: { id: true, nameEs: true },
    }),
  ]);

  const hours =
    business.hours && typeof business.hours === "object"
      ? (business.hours as WeekHours)
      : defaultHours;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil público</h1>
        <p className="text-muted-foreground">
          Esta información aparece en tu página del directorio. Los cambios se
          reflejan de inmediato.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{business.name}</CardTitle>
          <CardDescription>
            konnect.kmd.agency/negocio/{business.slug}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            categories={categories}
            initial={{
              name: business.name,
              categoryId: business.categoryId,
              description: business.description ?? "",
              languages: business.languages,
              phone: business.phone ?? "",
              whatsapp: business.whatsapp ?? "",
              email: business.email ?? "",
              website: business.website ?? "",
              address: business.address ?? "",
              city: business.city ?? "",
              zip: business.zip ?? "",
              logoUrl: business.logoUrl,
              coverUrl: business.coverUrl,
              hours,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

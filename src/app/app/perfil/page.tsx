import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireBusinessSession } from "@/lib/auth";
import { ProfileForm } from "@/components/crm/profile-form";

export default async function PerfilPage() {
  const { businessId } = await requireBusinessSession();

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil público</h1>
        <p className="text-muted-foreground">
          Esta información aparece en tu página del directorio.
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
            initial={{
              description: business.description ?? "",
              phone: business.phone ?? "",
              whatsapp: business.whatsapp ?? "",
              email: business.email ?? "",
              website: business.website ?? "",
              address: business.address ?? "",
              city: business.city ?? "",
              zip: business.zip ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

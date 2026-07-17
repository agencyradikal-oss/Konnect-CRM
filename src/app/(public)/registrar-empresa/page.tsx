import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RegisterWizard } from "@/components/business/register-wizard";

export const metadata: Metadata = {
  title: "Registra tu negocio",
  description:
    "Publica tu negocio gratis en el directorio de Konnect y recibe leads directo en tu CRM.",
};

const beneficios = [
  "Perfil público con SEO en Google",
  "Cada llamada, WhatsApp o mensaje se convierte en un lead en tu CRM",
  "Pipeline de ventas, contactos y tareas incluidos",
  "Plan gratis para empezar; Pro y Premium cuando crezcas",
];

export default async function RegistrarEmpresaPage() {
  const session = await auth();
  if (session?.user?.businessId) redirect("/app/dashboard");

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { nameEs: "asc" },
    select: { id: true, nameEs: true },
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">Registra tu negocio</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Únete al directorio de negocios hispanos de Atlanta y convierte
          visitas en clientes.
        </p>
        <ul className="mt-6 space-y-3">
          {beneficios.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del negocio</CardTitle>
          <CardDescription>
            {session?.user
              ? "Completa los datos; tu perfil quedará pendiente de aprobación."
              : "Primero crea tu cuenta para registrar tu negocio."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session?.user ? (
            <RegisterWizard categories={categories} />
          ) : (
            <div className="flex flex-col gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Crear cuenta gratis</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login?callbackUrl=/registrar-empresa">
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

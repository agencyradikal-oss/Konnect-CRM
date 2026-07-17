import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              K
            </span>
            <span className="text-lg">
              Konnect<span className="text-primary">™</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/directorio" className="hover:text-primary">
              Directorio
            </Link>
            <Link href="/registrar-empresa" className="hover:text-primary">
              Registra tu negocio
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <Button asChild size="sm">
                <Link href={session.user.role === "SUPER_ADMIN" ? "/admin" : "/app/dashboard"}>
                  Mi panel
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Konnect™ · KMD Agency</p>
          <p className="flex items-center gap-1">
            <MapPin className="size-4 text-primary" /> Atlanta metro, Georgia
          </p>
        </div>
      </footer>
    </div>
  );
}

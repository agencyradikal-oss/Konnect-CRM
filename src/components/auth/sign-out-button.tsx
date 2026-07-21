"use client";

import { useClerk } from "@clerk/nextjs";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { clearClerkBrowserCookies } from "@/lib/clerk-cookies";

type Props = {
  redirectUrl?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  showIcon?: boolean;
};

async function clearAllClerkCookies() {
  clearClerkBrowserCookies();
  try {
    await fetch("/api/auth/clear-clerk", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // ignore
  }
  clearClerkBrowserCookies();
}

export function SignOutButton({
  redirectUrl = "/",
  variant = "ghost",
  size = "default",
  className,
  label = "Cerrar sesión",
  showIcon = false,
}: Props) {
  const { signOut } = useClerk();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await clearAllClerkCookies();
          try {
            await signOut({ redirectUrl: undefined });
          } catch {
            // ignore
          }
          await clearAllClerkCookies();
          window.location.assign(redirectUrl);
        });
      }}
    >
      {showIcon ? <LogOut className="size-4" /> : null}
      {pending ? "Saliendo..." : label}
    </Button>
  );
}

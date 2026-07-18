"use client";

import { useEffect } from "react";
import { trackProfilePageView } from "@/actions/analytics";

/** Registra PageView una vez al montar el perfil público. */
export function ProfileViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void trackProfilePageView({ slug });
  }, [slug]);

  return null;
}

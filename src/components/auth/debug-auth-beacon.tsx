"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

/** Beacon de debug: Clerk client + /api/debug/auth-status (Prisma). */
export function DebugAuthBeacon() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;
    // #region agent log
    fetch("http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "11ae6f",
      },
      body: JSON.stringify({
        sessionId: "11ae6f",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "debug-auth-beacon.tsx:client",
        message: "clerk-client-state",
        data: {
          pathname,
          isLoaded,
          isSignedIn: Boolean(isSignedIn),
          hasUserId: Boolean(userId),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    void fetch("/api/debug/auth-status")
      .then((r) => r.json())
      .then((status) => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "11ae6f",
            },
            body: JSON.stringify({
              sessionId: "11ae6f",
              runId: "pre-fix",
              hypothesisId: "C",
              location: "debug-auth-beacon.tsx:prisma",
              message: "prisma-auth-status",
              data: { pathname, status },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
      })
      .catch((err) => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7725/ingest/0d89c625-de61-49ad-a5bd-b08d65357c43",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "11ae6f",
            },
            body: JSON.stringify({
              sessionId: "11ae6f",
              runId: "pre-fix",
              hypothesisId: "C",
              location: "debug-auth-beacon.tsx:prisma-error",
              message: "auth-status-fetch-failed",
              data: {
                pathname,
                error: err instanceof Error ? err.message : "unknown",
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
      });
  }, [isLoaded, isSignedIn, userId, pathname]);

  return null;
}

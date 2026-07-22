"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const ROTATE_MS = 2800;

export function HeroRotatingTitle({ cities }: { cities: string[] }) {
  const t = useTranslations("home");
  const list = useMemo(
    () => (cities.length > 0 ? cities : ["Atlanta"]),
    [cities],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (list.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [list]);

  const city = list[index] ?? "Atlanta";

  return (
    <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
      {t.rich("title", {
        city,
        highlight: (chunks) => (
          <span key={city} className="inline-block text-primary">
            {chunks}
          </span>
        ),
      })}
    </h1>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/actions/reviews";

export function ReviewForm({ businessSlug }: { businessSlug: string }) {
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitReview({
        businessSlug,
        authorName: String(fd.get("authorName") ?? ""),
        authorEmail: String(fd.get("authorEmail") ?? ""),
        rating,
        comment: String(fd.get("comment") ?? ""),
      });
      if (res.ok) {
        toast.success("Gracias. Tu reseña se publicará tras revisión.");
        e.currentTarget.reset();
        setRating(5);
      } else {
        toast.error(res.error ?? "No se pudo enviar la reseña.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Escribe una reseña</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="authorName">Nombre</Label>
          <Input id="authorName" name="authorName" required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="authorEmail">Email</Label>
          <Input
            id="authorEmail"
            name="authorEmail"
            type="email"
            required
            maxLength={160}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rating">Calificación</Label>
        <select
          id="rating"
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} estrellas
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="comment">Comentario</Label>
        <Textarea id="comment" name="comment" rows={3} maxLength={2000} />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Enviando…" : "Enviar reseña"}
      </Button>
    </form>
  );
}

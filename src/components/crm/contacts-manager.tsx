"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { toast } from "sonner";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDeal, importContacts, upsertContact } from "@/actions/crm";
import { formatMoney } from "@/lib/date-range";
import { StageBadge } from "@/components/crm/stage-badge";

export type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  deals: {
    id: string;
    title: string;
    stage: "NUEVO" | "CONTACTADO" | "COTIZADO" | "NEGOCIACION" | "GANADO" | "PERDIDO";
    value: number | null;
  }[];
};

type CsvPreview = {
  headers: string[];
  rows: Record<string, string>[];
};

export function ContactsManager({
  contacts,
  canImportCsv = false,
}: {
  contacts: ContactRow[];
  canImportCsv?: boolean;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<ContactRow | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [mapName, setMapName] = useState("");
  const [mapEmail, setMapEmail] = useState("");
  const [mapPhone, setMapPhone] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [contacts, q]);

  function openContact(c: ContactRow | null) {
    setSelected(c);
    setOpen(true);
  }

  function saveContact(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form));
    startTransition(async () => {
      const res = await upsertContact({
        contactId: selected?.id,
        ...data,
      });
      if (res.ok) {
        toast.success(selected ? "Contacto actualizado." : "Contacto creado.");
        setOpen(false);
      } else toast.error(res.error);
    });
  }

  function onFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        setPreview({ headers, rows: result.data });
        const lower = headers.map((h) => h.toLowerCase());
        const find = (...keys: string[]) =>
          headers[lower.findIndex((h) => keys.some((k) => h.includes(k)))] ?? "";
        setMapName(find("nombre", "name") || headers[0] || "");
        setMapEmail(find("email", "correo") || "");
        setMapPhone(find("phone", "tel", "telefono", "móvil", "movil") || "");
      },
      error: () => toast.error("No se pudo leer el CSV."),
    });
  }

  function runImport() {
    if (!preview || !mapName) {
      toast.error("Mapea al menos la columna de nombre.");
      return;
    }
    const rows = preview.rows
      .map((r) => ({
        name: (r[mapName] ?? "").trim(),
        email: mapEmail ? (r[mapEmail] ?? "").trim() : "",
        phone: mapPhone ? (r[mapPhone] ?? "").trim() : "",
      }))
      .filter((r) => r.name);

    if (rows.length === 0) {
      toast.error("No hay filas válidas.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await importContacts({ rows });
        if (res.ok) {
          toast.success(`Importados ${res.created} contactos.`);
          setImportOpen(false);
          setPreview(null);
        }
      } catch {
        toast.error("Error al importar. Revisa emails inválidos.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
          <p className="text-muted-foreground">
            Personas con relación comercial ({contacts.length})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canImportCsv ? (
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="size-4" /> Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Importar contactos</DialogTitle>
                <DialogDescription>
                  Mapea columnas nombre / email / teléfono. Se crean Contacts +
                  Leads con fuente IMPORT.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
                {preview && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Nombre *</Label>
                      <Select value={mapName} onValueChange={setMapName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Columna" />
                        </SelectTrigger>
                        <SelectContent>
                          {preview.headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Select
                        value={mapEmail || "__none__"}
                        onValueChange={(v) =>
                          setMapEmail(v === "__none__" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {preview.headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono</Label>
                      <Select
                        value={mapPhone || "__none__"}
                        onValueChange={(v) =>
                          setMapPhone(v === "__none__" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {preview.headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="sm:col-span-3 text-xs text-muted-foreground">
                      {preview.rows.length} filas detectadas (máx. 500).
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={pending || !preview}
                  onClick={runImport}
                >
                  {pending ? "Importando…" : "Importar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          ) : (
            <Button asChild variant="outline">
              <Link href="/app/plan">
                <Upload className="size-4" /> Import CSV (Pro+)
              </Link>
            </Button>
          )}

          <Button type="button" onClick={() => openContact(null)}>
            <Plus className="size-4" /> Nuevo
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nombre, email, tag..."
          className="pl-9"
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Sin contactos con ese filtro.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => openContact(c)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {c.phone ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.email ?? "—"}
                    </TableCell>
                    <TableCell>{c.deals.length}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {selected ? "Editar contacto" : "Nuevo contacto"}
            </SheetTitle>
            <SheetDescription>
              Los cambios se guardan en tu CRM (tenant actual).
            </SheetDescription>
          </SheetHeader>

          <form
            className="space-y-4 px-4 pb-8"
            onSubmit={(e) => {
              e.preventDefault();
              saveContact(e.currentTarget);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={selected?.name ?? ""}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selected?.phone ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selected?.email ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                name="company"
                defaultValue={selected?.company ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (separados por coma)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={selected?.tags.join(", ") ?? ""}
                placeholder="cliente, vip"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={selected?.notes ?? ""}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </form>

          {selected && (
            <div className="space-y-3 border-t px-4 pb-8 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Deals asociados</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await createDeal({
                        contactId: selected.id,
                        title: `Deal — ${selected.name}`,
                      });
                      if (res.ok) toast.success("Deal creado.");
                      else toast.error(res.error);
                    })
                  }
                >
                  <Plus className="size-4" /> Nuevo deal
                </Button>
              </div>
              {selected.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin deals.</p>
              ) : (
                <ul className="space-y-2">
                  {selected.deals.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.value != null ? formatMoney(d.value) : "Sin valor"}
                        </p>
                      </div>
                      <StageBadge stage={d.stage} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

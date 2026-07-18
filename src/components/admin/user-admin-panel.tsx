"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  assignUserBusiness,
  createAdminUser,
  resetUserPassword,
  setUserDisabled,
  updateUserRole,
} from "@/actions/admin-users";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
  business: { id: string; name: string; slug: string } | null;
};

export type BusinessOption = { id: string; name: string; slug: string };

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  BUSINESS_OWNER: "Dueño",
  BUSINESS_STAFF: "Staff",
};

export function UserAdminPanel({
  users,
  businesses,
}: {
  users: AdminUserRow[];
  businesses: BusinessOption[];
}) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!query) return true;
      return (
        u.email.toLowerCase().includes(query) ||
        (u.name?.toLowerCase().includes(query) ?? false) ||
        (u.business?.name.toLowerCase().includes(query) ?? false)
      );
    });
  }, [users, q, roleFilter]);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(success);
      else toast.error(res.error ?? "No se pudo completar.");
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
          <CardDescription>
            Agrega dueños, staff o super admins y asígnalos a un negocio del CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const role = String(fd.get("role") ?? "BUSINESS_STAFF") as Role;
              const businessId = String(fd.get("businessId") ?? "");
              run(
                () =>
                  createAdminUser({
                    name: String(fd.get("name") ?? ""),
                    email: String(fd.get("email") ?? ""),
                    password: String(fd.get("password") ?? ""),
                    role,
                    businessId:
                      role === "SUPER_ADMIN" || !businessId
                        ? null
                        : businessId,
                  }),
                "Usuario creado.",
              );
              if (!pending) e.currentTarget.reset();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña temporal</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue="BUSINESS_STAFF"
                className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="BUSINESS_STAFF">Staff</option>
                <option value="BUSINESS_OWNER">Dueño</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="businessId">Negocio (tenant)</Label>
              <select
                id="businessId"
                name="businessId"
                className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                defaultValue=""
              >
                <option value="">— Sin negocio —</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={pending}>
                Crear usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del CRM</CardTitle>
          <CardDescription>
            {filtered.length} de {users.length} usuarios
          </CardDescription>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Input
              placeholder="Buscar por nombre, email o negocio…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
                <SelectItem value="BUSINESS_OWNER">Dueño</SelectItem>
                <SelectItem value="BUSINESS_STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden md:table-cell">Negocio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="min-w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No hay usuarios con ese filtro.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <select
                        className="h-8 rounded-md border bg-transparent px-2 text-xs"
                        disabled={pending}
                        value={u.role}
                        onChange={(e) =>
                          run(
                            () =>
                              updateUserRole({
                                userId: u.id,
                                role: e.target.value as Role,
                              }),
                            "Rol actualizado.",
                          )
                        }
                      >
                        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <select
                        className="h-8 max-w-[180px] rounded-md border bg-transparent px-2 text-xs"
                        disabled={pending || u.role === "SUPER_ADMIN"}
                        value={u.business?.id ?? ""}
                        onChange={(e) =>
                          run(
                            () =>
                              assignUserBusiness({
                                userId: u.id,
                                businessId: e.target.value || null,
                              }),
                            "Negocio asignado.",
                          )
                        }
                      >
                        <option value="">— Sin negocio —</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          u.disabled
                            ? "border-0 bg-red-100 text-red-700"
                            : "border-0 bg-emerald-100 text-emerald-700"
                        }
                      >
                        {u.disabled ? "Desactivado" : "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={u.disabled ? "default" : "outline"}
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                setUserDisabled({
                                  userId: u.id,
                                  disabled: !u.disabled,
                                }),
                              u.disabled
                                ? "Usuario activado."
                                : "Usuario desactivado.",
                            )
                          }
                        >
                          {u.disabled ? "Activar" : "Desactivar"}
                        </Button>
                        <form
                          className="flex gap-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            const password = String(fd.get("password") ?? "");
                            if (password.length < 8) {
                              toast.error("Mínimo 8 caracteres.");
                              return;
                            }
                            run(
                              () =>
                                resetUserPassword({
                                  userId: u.id,
                                  password,
                                }),
                              "Contraseña restablecida.",
                            );
                            e.currentTarget.reset();
                          }}
                        >
                          <Input
                            name="password"
                            type="password"
                            placeholder="Nueva pass"
                            className="h-8 text-xs"
                            minLength={8}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            className="shrink-0"
                          >
                            Reset
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

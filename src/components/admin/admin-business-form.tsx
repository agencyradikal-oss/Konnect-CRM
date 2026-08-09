"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBusinessAsAdmin,
  updateBusinessAsAdmin,
} from "@/actions/admin-businesses";
import {
  HoursEditor,
  defaultHours,
  normalizeWeekHours,
  type WeekHours,
} from "@/components/business/hours-editor";
import { ImageUpload } from "@/components/business/image-upload";
import {
  SOCIAL_NETWORKS,
  type BusinessSocials,
  type SocialNetworkKey,
} from "@/lib/business-socials";

type CategoryOption = { id: string; nameEs: string };

export type AdminBusinessFormInitial = {
  name: string;
  categoryId: string;
  description: string;
  languages: string[];
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  zip: string;
  socials: BusinessSocials;
  logoUrl: string | null;
  coverUrl: string | null;
  hours: WeekHours;
};

export function AdminBusinessForm({
  categories,
  businessId,
  initial,
}: {
  categories: CategoryOption[];
  businessId?: string;
  initial?: Partial<AdminBusinessFormInitial>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(businessId);

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [languages, setLanguages] = useState<string[]>(
    initial?.languages?.length ? initial.languages : ["es"],
  );
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [zip, setZip] = useState(initial?.zip ?? "");
  const [socials, setSocials] = useState<BusinessSocials>(initial?.socials ?? {});
  const [hours, setHours] = useState<WeekHours>(() =>
    normalizeWeekHours(initial?.hours ?? defaultHours),
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  function setSocial(key: SocialNetworkKey, value: string) {
    setSocials((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const langs = languages.filter((l) => l === "es" || l === "en");
    const payload = {
      ...(isEdit ? { id: businessId } : {}),
      name: name ?? "",
      categoryId: categoryId ?? "",
      description: description ?? "",
      languages: langs.length ? langs : (["es"] as string[]),
      phone: phone ?? "",
      whatsapp: whatsapp ?? "",
      email: email ?? "",
      website: website ?? "",
      address: address ?? "",
      city: city ?? "",
      zip: zip ?? "",
      socials: {
        facebook: socials.facebook ?? "",
        instagram: socials.instagram ?? "",
        tiktok: socials.tiktok ?? "",
        linkedin: socials.linkedin ?? "",
      },
      hours: normalizeWeekHours(hours),
      logoUrl: logoUrl ?? null,
      coverUrl: coverUrl ?? null,
    };

    startTransition(async () => {
      try {
        const res = isEdit
          ? await updateBusinessAsAdmin(payload)
          : await createBusinessAsAdmin(payload);
        if (!res.ok) {
          toast.error(res.error ?? "No se pudo guardar.");
          return;
        }
        toast.success(isEdit ? "Negocio actualizado." : "Negocio creado y publicado.");
        router.push("/admin/negocios");
        router.refresh();
      } catch {
        toast.error("No se pudo guardar. Intenta de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold">Negocio</h3>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Categoría *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nameEs}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Idiomas atendidos</Label>
          <div className="flex gap-2">
            {[
              { id: "es", label: "Español" },
              { id: "en", label: "English" },
            ].map((lang) => (
              <Button
                key={lang.id}
                type="button"
                variant={languages.includes(lang.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLanguage(lang.id)}
              >
                {languages.includes(lang.id) && <Check className="size-4" />}
                {lang.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Contacto y ubicación</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="4045551234"
            />
            <p className="text-xs text-muted-foreground">
              Obligatorio para click-to-call y leads desde el directorio.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email público</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              placeholder="tuweb.com o https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Redes sociales</h4>
            <p className="text-xs text-muted-foreground">
              Opcional. Se muestran como iconos en el perfil público.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map((net) => (
              <div key={net.key} className="space-y-2">
                <Label htmlFor={`social-${net.key}`}>{net.label}</Label>
                <Input
                  id={`social-${net.key}`}
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  placeholder={net.placeholder}
                  value={socials[net.key] ?? ""}
                  onChange={(e) => setSocial(net.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="Atlanta"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">Código postal</Label>
            <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Imágenes y horario</h3>
        <div className="flex flex-wrap gap-6">
          <ImageUpload
            label="Logo"
            folder="logo"
            url={logoUrl}
            onUrlChange={setLogoUrl}
            existingUrl={initial?.logoUrl}
          />
          <ImageUpload
            label="Portada"
            folder="cover"
            url={coverUrl}
            onUrlChange={setCoverUrl}
            existingUrl={initial?.coverUrl}
            aspect="wide"
          />
        </div>
        <HoursEditor value={hours} onChange={setHours} />
      </section>

      <Button type="submit" disabled={pending} size="lg">
        {pending
          ? "Guardando..."
          : isEdit
            ? "Guardar cambios"
            : "Crear y publicar"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
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
import { updateBusinessProfile } from "@/actions/business";
import { HoursEditor, defaultHours, type WeekHours } from "@/components/business/hours-editor";
import { ImageUpload } from "@/components/business/image-upload";
import { GalleryManager } from "@/components/crm/gallery-manager";

type CategoryOption = { id: string; nameEs: string };

type ProfileInitial = {
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
  logoUrl: string | null;
  coverUrl: string | null;
  gallery: string[];
  hours: WeekHours;
};

export function ProfileForm({
  initial,
  categories,
  galleryMax,
}: {
  initial: ProfileInitial;
  categories: CategoryOption[];
  galleryMax: number;
}) {
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial.name);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [description, setDescription] = useState(initial.description);
  const [languages, setLanguages] = useState<string[]>(
    initial.languages.length ? initial.languages : ["es"]
  );
  const [phone, setPhone] = useState(initial.phone);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [email, setEmail] = useState(initial.email);
  const [website, setWebsite] = useState(initial.website);
  const [address, setAddress] = useState(initial.address);
  const [city, setCity] = useState(initial.city);
  const [zip, setZip] = useState(initial.zip);
  const [hours, setHours] = useState<WeekHours>(initial.hours ?? defaultHours);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("name", name);
    formData.set("categoryId", categoryId);
    formData.set("description", description);
    formData.set("languages", JSON.stringify(languages));
    formData.set("phone", phone);
    formData.set("whatsapp", whatsapp);
    formData.set("email", email);
    formData.set("website", website);
    formData.set("address", address);
    formData.set("city", city);
    formData.set("zip", zip);
    formData.set("hours", JSON.stringify(hours));
    if (logoUrl) formData.set("logoUrl", logoUrl);
    if (coverUrl) formData.set("coverUrl", coverUrl);

    startTransition(async () => {
      const res = await updateBusinessProfile(formData);
      if (res.ok) toast.success("Perfil actualizado.");
      else toast.error(res.error ?? "No se pudo guardar.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold">Negocio</h3>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
            />
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
              placeholder="https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
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
            existingUrl={initial.logoUrl}
          />
          <ImageUpload
            label="Portada"
            folder="cover"
            url={coverUrl}
            onUrlChange={setCoverUrl}
            existingUrl={initial.coverUrl}
            aspect="wide"
          />
        </div>
        <GalleryManager gallery={initial.gallery} maxPhotos={galleryMax} />
        <HoursEditor value={hours} onChange={setHours} />
      </section>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

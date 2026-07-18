"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { registerBusinessFull } from "@/actions/business";
import { HoursEditor, defaultHours, type WeekHours } from "./hours-editor";
import { ImageUpload } from "./image-upload";

type CategoryOption = { id: string; nameEs: string };

const steps = ["Negocio", "Contacto y ubicación", "Imágenes y horario"];

export function RegisterWizard({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  // Paso 1
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [languages, setLanguages] = useState<string[]>(["es"]);
  // Paso 2
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  // Paso 3
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hours, setHours] = useState<WeekHours>(defaultHours);

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (name.trim().length < 2) return "Escribe el nombre del negocio.";
      if (!categoryId) return "Selecciona una categoría.";
      if (languages.length === 0) return "Selecciona al menos un idioma.";
    }
    if (step === 1) {
      if (phone.trim().length < 7) return "Escribe un teléfono válido.";
      if (!city.trim()) return "Escribe la ciudad.";
    }
    return null;
  }

  function next() {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function submit() {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("categoryId", categoryId);
    formData.set("description", description);
    formData.set("languages", JSON.stringify(languages));
    formData.set("phone", phone);
    formData.set("whatsapp", whatsapp);
    formData.set("email", email);
    formData.set("address", address);
    formData.set("city", city);
    formData.set("zip", zip);
    formData.set("hours", JSON.stringify(hours));
    if (logoUrl) formData.set("logoUrl", logoUrl);
    if (coverUrl) formData.set("coverUrl", coverUrl);

    startTransition(async () => {
      try {
        const res = await registerBusinessFull(formData);
        if (res.ok) {
          toast.success("¡Negocio registrado! Tu perfil está en revisión.");
          router.refresh();
          router.push("/app/dashboard?nuevo=1");
        } else {
          toast.error(res.error);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? "");
        if (/body exceed|body size|too large|413/i.test(message)) {
          toast.error(
            "Las imágenes son demasiado grandes. Usa fotos más ligeras (menos de 1 MB) o quítalas y súbelas después en Mi Perfil.",
          );
        } else {
          toast.error(
            "No se pudo publicar el negocio. Intenta de nuevo o registra sin imágenes.",
          );
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <ol className="flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary/20 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === step ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Paso 1: negocio */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del negocio *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Granitos El Águila"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
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
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntale a tus clientes qué haces, tu experiencia y por qué elegirte..."
            />
          </div>
          <div className="space-y-2">
            <Label>Idiomas atendidos *</Label>
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
        </div>
      )}

      {/* Paso 2: contacto y ubicación */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(770) 555-0100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (con código de país)</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="17705550100"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email público</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@tunegocio.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1845 Beaver Ruin Rd"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Norcross"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Código postal</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="30071"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ubicaremos tu negocio en el mapa automáticamente con esta dirección.
          </p>
        </div>
      )}

      {/* Paso 3: imágenes y horario */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-6">
            <ImageUpload
              label="Logo"
              folder="logo"
              url={logoUrl}
              onUrlChange={setLogoUrl}
            />
            <ImageUpload
              label="Portada"
              folder="cover"
              url={coverUrl}
              onUrlChange={setCoverUrl}
              aspect="wide"
            />
          </div>
          <div className="space-y-2">
            <Label>Horario de atención</Label>
            <HoursEditor value={hours} onChange={setHours} />
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || pending}
        >
          <ArrowLeft className="size-4" /> Atrás
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={next}>
            Siguiente <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Publicando..." : "Publicar mi negocio"}
          </Button>
        )}
      </div>
    </div>
  );
}

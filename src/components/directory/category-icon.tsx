import type { LucideIcon } from "lucide-react";
import {
  Brush,
  Bus,
  Calculator,
  Car,
  Coffee,
  Croissant,
  Dumbbell,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Layers,
  Megaphone,
  PartyPopper,
  PawPrint,
  Scale,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
  Trees,
  Truck,
  Utensils,
  Wrench,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  hammer: Hammer,
  layers: Layers,
  utensils: Utensils,
  "heart-pulse": HeartPulse,
  scale: Scale,
  shield: Shield,
  home: Home,
  sparkles: Sparkles,
  car: Car,
  brush: Brush,
  megaphone: Megaphone,
  calculator: Calculator,
  "shopping-cart": ShoppingCart,
  store: Store,
  coffee: Coffee,
  croissant: Croissant,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  wrench: Wrench,
  trees: Trees,
  truck: Truck,
  "paw-print": PawPrint,
  "party-popper": PartyPopper,
  bus: Bus,
};

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Store;
  return <Icon className={className} aria-hidden />;
}

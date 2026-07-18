"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StageBadge } from "@/components/crm/stage-badge";
import { DealStageSelect } from "@/components/crm/deal-stage-select";
import { DealDetailSheet } from "@/components/crm/deal-detail-sheet";
import { updateDealStage } from "@/actions/crm";
import { DEAL_STAGES, type DealCardData } from "@/lib/deals";
import { formatMoney } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import type { DealStage } from "@prisma/client";

function DealCard({
  deal,
  dragging,
  onOpen,
}: {
  deal: DealCardData;
  dragging?: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id, data: { stage: deal.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing",
        (isDragging || dragging) && "opacity-40",
      )}
      onClick={onOpen}
    >
      <p className="text-sm font-semibold leading-snug">{deal.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {deal.contact?.name ?? "Sin contacto"}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-primary">
          {deal.value != null ? formatMoney(deal.value) : "—"}
        </span>
        <span className="text-muted-foreground">{deal.daysInStage}d</span>
      </div>
    </div>
  );
}

function Column({
  stage,
  label,
  deals,
  onOpen,
}: {
  stage: DealStage;
  label: string;
  deals: DealCardData[];
  onOpen: (deal: DealCardData) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {deals.length}
        </span>
      </div>
      <SortableContext
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto p-2">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onOpen={() => onOpen(deal)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function DealsBoard({
  deals: initialDeals,
  pipeline,
}: {
  deals: DealCardData[];
  pipeline: number;
}) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DealCardData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStage = useMemo(() => {
    const map = Object.fromEntries(
      DEAL_STAGES.map((s) => [s.id, [] as DealCardData[]]),
    ) as Record<DealStage, DealCardData[]>;
    for (const d of deals) map[d.stage].push(d);
    return map;
  }, [deals]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    let nextStage: DealStage | null = null;
    const overId = String(over.id);
    if (DEAL_STAGES.some((s) => s.id === overId)) {
      nextStage = overId as DealStage;
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) nextStage = overDeal.stage;
    }

    if (!nextStage || nextStage === deal.stage) return;

    const prev = deals;
    setDeals((list) =>
      list.map((d) =>
        d.id === dealId
          ? { ...d, stage: nextStage!, daysInStage: 0, updatedAt: new Date().toISOString() }
          : d,
      ),
    );

    startTransition(async () => {
      const res = await updateDealStage({ dealId, stage: nextStage });
      if (!res.ok) {
        setDeals(prev);
        toast.error(res.error ?? "No se pudo mover el deal.");
      }
    });
  }

  function openDeal(deal: DealCardData) {
    // refresh from local state
    const fresh = deals.find((d) => d.id === deal.id) ?? deal;
    setSelected(fresh);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Pipeline abierto: {formatMoney(pipeline)}
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            type="button"
            size="sm"
            variant={view === "kanban" ? "default" : "ghost"}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="size-4" /> Kanban
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "ghost"}
            onClick={() => setView("table")}
          >
            <List className="size-4" /> Tabla
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:-mx-0 md:px-0">
            {DEAL_STAGES.map((stage) => (
              <Column
                key={stage.id}
                stage={stage.id}
                label={stage.label}
                deals={byStage[stage.id]}
                onOpen={openDeal}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal ? (
              <div className="w-72 rounded-lg border bg-card p-3 shadow-lg">
                <p className="text-sm font-semibold">{activeDeal.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {deals.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Sin deals. Convierte un lead para crear el primero.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="hidden md:table-cell">Valor</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="hidden lg:table-cell">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow
                      key={deal.id}
                      className="cursor-pointer"
                      onClick={() => openDeal(deal)}
                    >
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {deal.contact?.name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {deal.value != null ? formatMoney(deal.value) : "—"}
                      </TableCell>
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <StageBadge stage={deal.stage} />
                          <DealStageSelect dealId={deal.id} stage={deal.stage} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {deal.daysInStage}d
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <DealDetailSheet
        deal={selected ? deals.find((d) => d.id === selected.id) ?? selected : null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

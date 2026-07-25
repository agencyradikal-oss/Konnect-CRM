import { Prisma } from "@prisma/client";

export type MoneyLine = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineAmount(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export function computeDocumentTotals(
  lines: MoneyLine[],
  taxRatePercent: number,
) {
  const subtotal = roundMoney(
    lines.reduce((sum, l) => sum + lineAmount(l.quantity, l.unitPrice), 0),
  );
  const taxRate = Math.max(0, Math.min(100, taxRatePercent));
  const taxAmount = roundMoney(subtotal * (taxRate / 100));
  const total = roundMoney(subtotal + taxAmount);
  return { subtotal, taxRate, taxAmount, total };
}

export function toDecimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(roundMoney(n).toFixed(2));
}

export function decimalToNumber(value: Prisma.Decimal | number | null): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

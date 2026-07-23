import { z } from "zod";
import { LeadSource } from "@prisma/client";

/** Schema del formulario público El Puente (testable sin Server Actions). */
export const bridgeLeadDataSchema = z
  .object({
    name: z.string().min(1, "Tu nombre es requerido").max(120),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().max(30).optional().or(z.literal("")),
    message: z.string().max(2000).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    const hasEmail = Boolean(val.email?.trim());
    const hasPhone = Boolean(val.phone?.trim());
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: "custom",
        message: "Indica un email o un teléfono.",
        path: ["email"],
      });
    }
  });

export const bridgeFormSourceSchema = z.enum([
  LeadSource.DIRECTORY_FORM,
  LeadSource.QUOTE_REQUEST,
]);

/**
 * Capacidad de borrado/anulación en el CRM (tenant-scoped).
 * Usar como referencia de producto al añadir UI o actions.
 */
export const CRM_DELETABLE = {
  task: { hardDelete: true, note: "deleteTask — cualquier tarea del negocio" },
  lead: {
    hardDelete: true,
    note: "deleteLead — solo si status !== CONVERTED",
  },
  contact: { hardDelete: false, note: "Sin delete; solo upsert" },
  deal: { hardDelete: false, note: "Sin delete; cambiar etapa / editar" },
  appointment: {
    hardDelete: false,
    note: "cancelAppointment (status CANCELED)",
  },
  estimate: { hardDelete: false, note: "voidEstimate (anular)" },
  invoice: { hardDelete: false, note: "markInvoicePaid — no delete" },
  galleryImage: { hardDelete: true, note: "removeGalleryImage" },
  apiKey: { hardDelete: false, note: "revokeBusinessApiKey" },
  review: { hardDelete: true, note: "deleteReview — solo SUPER_ADMIN" },
} as const;

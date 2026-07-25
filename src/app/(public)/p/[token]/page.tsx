import type { Metadata } from "next";
import { getPublicEstimate } from "@/actions/public-estimate";
import { PublicEstimateClient } from "@/components/estimates/public-estimate-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Presupuesto",
  robots: { index: false },
};

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getPublicEstimate(token);

  if (!preview.ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Presupuesto no disponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">{preview.error}</p>
      </div>
    );
  }

  return <PublicEstimateClient token={token} estimate={preview.estimate} />;
}

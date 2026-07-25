import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getClaimPreview } from "@/actions/claim-business";
import { ClaimBusinessClient } from "@/components/claim/claim-business-client";

export const metadata: Metadata = {
  title: "Reclamar negocio",
  robots: { index: false },
};

export default async function ReclamarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getClaimPreview(token);
  const session = await auth();

  if (!preview.ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No se puede reclamar</h1>
        <p className="mt-2 text-sm text-muted-foreground">{preview.error}</p>
      </div>
    );
  }

  return (
    <ClaimBusinessClient
      token={token}
      businessName={preview.businessName}
      claimEmailMasked={preview.claimEmailMasked}
      isSignedIn={Boolean(session?.user)}
      sessionEmail={session?.user?.email ?? null}
    />
  );
}

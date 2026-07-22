import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto-secrets";
import { refreshGoogleAccessToken } from "@/lib/google/oauth";

/** Obtiene access token válido para la conexión del usuario en el negocio. */
export async function getValidGoogleAccessToken(params: {
  businessId: string;
  userId: string;
}) {
  const conn = await prisma.googleConnection.findUnique({
    where: {
      businessId_userId: {
        businessId: params.businessId,
        userId: params.userId,
      },
    },
  });
  if (!conn) return null;

  const stillValid =
    conn.expiresAt && conn.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) {
    return {
      accessToken: decryptSecret(conn.accessTokenEnc),
      connection: conn,
    };
  }

  const refresh = decryptSecret(conn.refreshTokenEnc);
  const tokens = await refreshGoogleAccessToken(refresh);
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const updated = await prisma.googleConnection.update({
    where: { id: conn.id },
    data: {
      accessTokenEnc: encryptSecret(tokens.access_token),
      expiresAt,
      ...(tokens.scope
        ? { scopes: tokens.scope.split(/\s+/).filter(Boolean) }
        : {}),
    },
  });

  return { accessToken: tokens.access_token, connection: updated };
}

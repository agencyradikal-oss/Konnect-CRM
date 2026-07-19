import { verifyWebhook } from "@clerk/backend/webhooks";
import { prisma } from "@/lib/prisma";
import { upsertUserFromClerk } from "@/lib/clerk-sync";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[clerk webhook] verify failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        await upsertUserFromClerk(evt.data as unknown as Record<string, unknown>, {
          sendWelcome: evt.type === "user.created",
        });
        break;
      }
      case "user.deleted": {
        const clerkId = evt.data.id;
        if (clerkId) {
          await prisma.user.updateMany({
            where: { clerkUserId: clerkId },
            data: { disabled: true, clerkUserId: null },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[clerk webhook] handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

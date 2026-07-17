import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: Role;
    businessId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      businessId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    businessId: string | null;
  }
}

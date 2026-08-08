import { UnauthorizedError } from "@/lib/errors";
import { db } from "@/lib/db/client";
import { UsersRepository } from "@/modules/users";
import { ANALYTICS_EVENTS, emitEvent } from "@/modules/analytics";

/**
 * Demo fallback identity used until Clerk is configured.
 * The demo user is created by `npm run db:seed`.
 */
const DEMO_CLERK_ID = "demo_user";

/**
 * Resolves the internal user id for the current request.
 *
 * - When Clerk is configured (CLERK_SECRET_KEY), the session identity is used
 *   and a local profile is auto-provisioned on first sign-in.
 * - Otherwise the seeded demo user is used so the product works locally
 *   without any external service.
 *
 * Throws UnauthorizedError when no identity can be resolved.
 */
export async function getCurrentUserId(): Promise<string> {
  const usersRepository = new UsersRepository(db);

  if (process.env.CLERK_SECRET_KEY) {
    const clerkUserId = await resolveClerkUserId();
    if (clerkUserId) {
      const existing = await usersRepository.findByClerkId(clerkUserId);
      if (existing) {
        return existing.id;
      }
      const clerkUser = await fetchClerkUser(clerkUserId);
      if (clerkUser) {
        const created = await usersRepository.create(clerkUser);
        emitEvent(created.id, ANALYTICS_EVENTS.USER_CREATED, { source: "clerk" });
        return created.id;
      }
      throw new UnauthorizedError("Clerk user could not be provisioned");
    }
  }

  const demo = await usersRepository.findByClerkId(DEMO_CLERK_ID);
  if (!demo) {
    throw new UnauthorizedError(
      "No session found. Configure CLERK_SECRET_KEY or seed the demo user with `npm run db:seed`."
    );
  }
  return demo.id;
}

async function resolveClerkUserId(): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    return session.userId ?? null;
  } catch {
    return null;
  }
}

async function fetchClerkUser(clerkUserId: string) {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return null;
    }
    return {
      clerkUserId,
      email,
      name: user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : null,
      avatarUrl: user.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}

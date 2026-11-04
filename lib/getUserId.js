import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getUserId(request) {
  const { userId: sessionUserId } = await auth();
  if (sessionUserId) return sessionUserId;

  if (!request) return null;

  try {
    const client = await clerkClient();
    const requestState = await client.authenticateRequest(request, {
      authorizedParties: [
        "http://localhost:3000",
        "https://quick-cart-jet-iota.vercel.app",
      ],
    });

    if (requestState.isSignedIn) {
      return requestState.toAuth().userId;
    }
  } catch (error) {
    console.error("authenticateRequest failed:", error.message);
  }

  return null;
}

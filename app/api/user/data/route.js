import connectDB from "@/config/db";
import { getUserId } from "@/lib/getUserId";
import User from "@/models/User";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    await connectDB();
    let user = await User.findById(userId);

    // Create MongoDB user if Clerk sync (Inngest) missed this account
    if (!user) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      user = await User.create({
        _id: userId,
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User",
        email:
          clerkUser.emailAddresses[0]?.emailAddress || `${userId}@clerk.local`,
        imageUrl: clerkUser.imageUrl || "",
        cartItems: {},
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

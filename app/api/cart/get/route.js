import connectDB from "@/config/db";
import { getUserId } from "@/lib/getUserId";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    return NextResponse.json({
      success: true,
      cartItems: user.cartItems || {},
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

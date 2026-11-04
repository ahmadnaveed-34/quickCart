import connectDB from "@/config/db";
import { getUserId } from "@/lib/getUserId";
import Address from "@/models/Address";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    await connectDB();
    const addresses = await Address.find({ userId });
    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

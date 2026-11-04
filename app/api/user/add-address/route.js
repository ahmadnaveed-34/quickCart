import connectDB from "@/config/db";
import { getUserId } from "@/lib/getUserId";
import Address from "@/models/Address";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const { address } = await request.json();

    await connectDB();
    const newAddress = await Address.create({
      ...address,
      userId,
    });
    return NextResponse.json({
      success: true,
      message: "Address added successfully",
      newAddress,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

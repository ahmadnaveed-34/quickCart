import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getUserId } from "@/lib/getUserId";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    await connectDB();
    const products = await Product.find({});
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

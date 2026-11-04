import connectDB from "@/config/db";
import { getUserId } from "@/lib/getUserId";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    await connectDB();

    let orders = await Order.find({ userId })
      .populate({ path: "items.product", model: Product })
      .populate({ path: "address", model: Address })
      .lean();

    // Fallback: if address is still just an ID string, fetch manually
    orders = await Promise.all(
      orders.map(async (order) => {
        if (order.address && typeof order.address !== "object") {
          order.address = await Address.findById(order.address).lean();
        }
        return order;
      }),
    );

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message });
  }
}

import connectDB from "@/config/db";
import { inngest } from "@/config/ingest";
import { getUserId } from "@/lib/getUserId";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const { address, items } = await request.json();

    if (!address || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    await connectDB();

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: "Product not found",
        });
      }
      amount += product.offerPrice * item.quantity;
    }

    const orderAmount = amount + Math.floor(amount * 0.02);
    const orderDate = Date.now();

    // Save directly so order appears in DB even if Inngest is delayed
    const order = await Order.create({
      userId,
      address: String(address),
      items,
      amount: orderAmount,
      date: orderDate,
    });

    try {
      await inngest.send({
        name: "order/created",
        data: {
          userId,
          address: String(address),
          items,
          amount: orderAmount,
          date: orderDate,
          orderId: order._id.toString(),
        },
      });
    } catch (inngestError) {
      console.error("Inngest send failed:", inngestError.message);
    }

    const user = await User.findById(userId);
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Order Placed",
      order,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}

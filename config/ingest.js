import User from "@/models/User";
import { Inngest } from "inngest";
import connectDB from "./db";
import Order from "@/models/Order";

export const inngest = new Inngest({ id: "quickcart-next" });

// Inngest Function to save user to database
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      imageUrl: image_url,
      cartItems: {},
    };
    await connectDB();
    await User.create(userData);
  },
);

// Inngest Function to update user in database
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      imageUrl: image_url,
    };
    await connectDB();
    await User.findByIdAndUpdate(id, userData, { new: true });
  },
);

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await connectDB();
    await User.findByIdAndDelete(id);
  },
);

// Inngest Function to create order
export const createUserOrder = inngest.createFunction(
  {
    id: "create-user-order",
    batchEvents: { maxSize: 5, timeout: "5s" },
  },
  { event: "order/created" },
  async ({ events, step }) => {
    const orders = await step.run("prepare-orders", async () => {
      return events
        .filter((event) => !event.data.orderId) // skip if already saved in API
        .map((event) => ({
          userId: event.data.userId,
          items: event.data.items,
          amount: event.data.amount,
          address: String(event.data.address),
          date: event.data.date,
          status: "Order Placed",
        }));
    });

    if (!orders.length) {
      return { success: true, processed: 0, skipped: events.length };
    }

    const result = await step.run("insert-orders", async () => {
      await connectDB();
      const inserted = await Order.insertMany(orders, { ordered: true });
      return { processed: inserted.length };
    });

    return { success: true, ...result };
  },
);

import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    secure: true,
  });
}

export async function POST(request) {
  try {
    configureCloudinary();

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to add a product",
      });
    }

    const formData = await request.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const category = formData.get("category");
    const price = formData.get("price");
    const offerPrice = formData.get("offerPrice");

    const files = formData
      .getAll("images")
      .filter((file) => file && typeof file === "object" && file.size > 0);

    if (!files.length) {
      return NextResponse.json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    const result = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const dataUri = `data:${file.type || "image/png"};base64,${base64}`;

        return cloudinary.uploader.upload(dataUri, {
          resource_type: "image",
        });
      }),
    );

    const image = result.map((item) => item.secure_url);

    await connectDB();
    const newProduct = await Product.create({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: Number(offerPrice),
      images: image,
      date: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      newProduct,
    });
  } catch (error) {
    const message =
      error?.error?.message ||
      error?.message ||
      "Failed to add product";

    return NextResponse.json({
      success: false,
      message,
      details: {
        http_code: error?.http_code || error?.error?.http_code,
        name: error?.name || error?.error?.name,
      },
    });
  }
}

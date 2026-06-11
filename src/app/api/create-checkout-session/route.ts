import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { userId, userEmail } = (await req.json()) as {
    userId: string;
    userEmail: string | null;
  };

  const baseUrl = req.headers.get("origin") ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: { name: "LogicVoice 無制限プラン" },
          unit_amount: 500,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: userEmail ?? undefined,
    metadata: { userId },
    success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}

import { NextRequest } from "next/server";
import { quoteSchema } from "@/lib/validators";
import { calculateQuote, PricingError } from "@/lib/pricing";
import { HttpError, ok, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";

export const POST = route(async (req: NextRequest) => {
  await rateLimit(`quote:${clientIp(req)}`, 60, 60);
  const input = quoteSchema.parse(await req.json());
  try {
    return ok(await calculateQuote(input));
  } catch (error) {
    if (error instanceof PricingError) throw new HttpError(422, error.message);
    throw error;
  }
});

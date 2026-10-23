import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { HttpError, ok, route } from "@/lib/api";
import { getDateOptions } from "@/lib/availability";

export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const newspaperId = req.nextUrl.searchParams.get("newspaperId");
  if (!newspaperId) throw new HttpError(422, "newspaperId is required");

  const [options, existing] = await Promise.all([
    getDateOptions(newspaperId),
    adminDb.collection("dateAvailability").where("newspaperId", "==", newspaperId).get(),
  ]);
  const overrides = new Map(existing.docs.map((doc) => [doc.data().date as string, doc.data()]));
  const dates = options.map((option) => {
    const override = overrides.get(option.date);
    const isLegacyFull =
      override?.capacity != null && ((override.booked as number | undefined) ?? 0) >= override.capacity;
    return {
      ...option,
      available: option.available && !isLegacyFull,
      reason: option.reason ?? (isLegacyFull ? "full" : undefined),
    };
  });
  return ok(dates);
});

// src/app/api/admin/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // 1. Toggle Newspaper <-> Location Mapping
    if (action === "update_mapping") {
      const { newspaperId, locationId, isEnabled } = body;
      if (!newspaperId || !locationId) {
        return NextResponse.json({ error: "Missing newspaperId or locationId" }, { status: 400 });
      }
      const mapId = `${newspaperId}_${locationId}`;
      await adminDb.collection("newspaper_locations").doc(mapId).set(
        {
          id: mapId,
          newspaperId,
          locationId,
          isEnabled: Boolean(isEnabled),
          updatedBy: "ADMIN_PORTAL",
          updatedAt: nowIso,
        },
        { merge: true }
      );
      return NextResponse.json({ success: true, message: "Mapping updated successfully." });
    }

    // 2. Save Pricing Rule (Inputs in Rupees, stored as Integer Paise)
    if (action === "save_pricing_rule") {
      const {
        newspaperId,
        formatId,
        baseChargeRupees,
        includedWords,
        extraWordRateRupees,
        ratePerSqCmRupees,
        colorSurchargePercent,
        boxBorderAddonRupees,
        gstPercent,
      } = body;

      if (!newspaperId || !formatId) {
        return NextResponse.json({ error: "Newspaper and Format are required" }, { status: 400 });
      }

      const ruleId = `${newspaperId}_${formatId}`;
      const pricingPayload = {
        id: ruleId,
        newspaperId,
        formatId,
        isConfigured: true,
        baseChargePaise: Math.round(Number(baseChargeRupees || 0) * 100),
        includedWords: Number(includedWords || 20),
        extraWordRatePaise: Math.round(Number(extraWordRateRupees || 0) * 100),
        ratePerSqCmPaise: Math.round(Number(ratePerSqCmRupees || 0) * 100),
        colorSurchargePercent: Number(colorSurchargePercent || 0),
        boxBorderAddonPaise: Math.round(Number(boxBorderAddonRupees || 0) * 100),
        gstPercent: Number(gstPercent || 5),
        effectiveFromIso: nowIso,
        version: 1,
      };

      await adminDb.collection("pricing_rules").doc(ruleId).set(pricingPayload, { merge: true });
      return NextResponse.json({ success: true, message: "Pricing rule saved successfully." });
    }

    // 3. Open Publication Date Slot
    if (action === "open_date_slot") {
      const { newspaperId, date, maxSlots, cutoffHoursBeforePublication, dateSurchargeRupees } = body;

      if (!newspaperId || !date) {
        return NextResponse.json({ error: "Newspaper and Date are required" }, { status: 400 });
      }

      const slotId = `${newspaperId}_${date}`;
      const cutoffTime = new Date(new Date(`${date}T00:00:00`).getTime() - Number(cutoffHoursBeforePublication || 48) * 3600 * 1000).toISOString();

      const slotPayload = {
        id: slotId,
        newspaperId,
        date,
        isOpen: true,
        isHoliday: false,
        maxSlots: Number(maxSlots || 25),
        bookedSlots: 0,
        cutoffTimestampIso: cutoffTime,
        dateSurchargePaise: Math.round(Number(dateSurchargeRupees || 0) * 100),
      };

      await adminDb.collection("publication_availability").doc(slotId).set(slotPayload, { merge: true });
      return NextResponse.json({ success: true, message: "Publication slot opened successfully." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[api/admin/config]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
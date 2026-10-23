// src/app/admin/page.tsx
"use client";

import React, { useState } from "react";
import { ShieldCheck, MapPin, Calculator, Calendar, CheckCircle, AlertCircle } from "lucide-react";

type AdminAction = "update_mapping" | "save_pricing_rule" | "open_date_slot";

const LOCATIONS = [
  { id: "kelambakkam", name: "Kelambakkam" },
  { id: "porur", name: "Porur" },
  { id: "vadapalani", name: "Vadapalani" },
  { id: "anna-nagar", name: "Anna Nagar" },
  { id: "chrompet", name: "Chrompet" },
];

const NEWSPAPERS = [
  { id: "omr-voice", name: "OMR Voice" },
  { id: "tambaram-times", name: "Tambaram Times" },
  { id: "nanganallur-times", name: "Saisakthi Publications" },
  { id: "velachery-mail", name: "Velachery Mail" },
];

const FORMATS = [
  { id: "text-classified", name: "Text-Only Classified" },
  { id: "box-ad", name: "Box Advertisement" },
  { id: "display-ad", name: "Display Advertisement" },
  { id: "custom-ad", name: "Custom Advertisement" },
];

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<"mappings" | "pricing" | "availability">("mappings");
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mapping state
  const [selectedMappingNewspaper, setSelectedMappingNewspaper] = useState("nanganallur-times");
  const [selectedMappingLocation, setSelectedMappingLocation] = useState("kelambakkam");
  const [mappingEnabled, setMappingEnabled] = useState(true);

  // Pricing state
  const [pricingNewspaper, setPricingNewspaper] = useState("nanganallur-times");
  const [pricingFormat, setPricingFormat] = useState("text-classified");
  const [baseChargeRupees, setBaseChargeRupees] = useState("500");
  const [includedWords, setIncludedWords] = useState("20");
  const [extraWordRateRupees, setExtraWordRateRupees] = useState("25");
  const [ratePerSqCmRupees, setRatePerSqCmRupees] = useState("0");
  const [colorSurchargePercent, setColorSurchargePercent] = useState("20");
  const [boxBorderAddonRupees, setBoxBorderAddonRupees] = useState("100");
  const [gstPercent, setGstPercent] = useState("5");

  // Availability state
  const [availNewspaper, setAvailNewspaper] = useState("nanganallur-times");
  const [availDate, setAvailDate] = useState("");
  const [maxSlots, setMaxSlots] = useState("25");
  const [cutoffHours, setCutoffHours] = useState("48");
  const [dateSurchargeRupees, setDateSurchargeRupees] = useState("0");

  async function handleAction(
    actionType: AdminAction,
    payload: Record<string, string | boolean>
  ) {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setStatusMessage({ text: data.message || "Saved successfully!" });
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Operation failed",
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-brand-navy" />
              <h1 className="text-2xl font-extrabold text-brand-navy">Saisakthi Publications Admin Portal</h1>
            </div>
            <p className="mt-1 text-xs text-brand-muted">
              Configure location-newspaper mappings, rate cards, and publication date availability.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("mappings")}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${
                activeTab === "mappings" ? "bg-brand-navy text-white" : "border border-brand-border bg-brand-card text-brand-text"
              }`}
            >
              Mappings
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${
                activeTab === "pricing" ? "bg-brand-navy text-white" : "border border-brand-border bg-brand-card text-brand-text"
              }`}
            >
              Pricing Rules
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${
                activeTab === "availability" ? "bg-brand-navy text-white" : "border border-brand-border bg-brand-card text-brand-text"
              }`}
            >
              Date Availability
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            role="alert"
            className={`mt-6 flex items-center gap-2.5 rounded-lg border p-4 text-sm font-medium ${
              statusMessage.isError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {statusMessage.isError ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-emerald-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: MAPPINGS */}
        {activeTab === "mappings" && (
          <div className="mt-8 rounded-xl border border-brand-border bg-brand-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-blue" /> Configure Newspaper & Neighborhood Mappings
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              Enables or disables which newspapers serve each neighbourhood during customer booking.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-brand-text">Select Newspaper</label>
                <select
                  value={selectedMappingNewspaper}
                  onChange={(e) => setSelectedMappingNewspaper(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                >
                  {NEWSPAPERS.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Select Location</label>
                <select
                  value={selectedMappingLocation}
                  onChange={(e) => setSelectedMappingLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Mapping Status</label>
                <select
                  value={mappingEnabled ? "yes" : "no"}
                  onChange={(e) => setMappingEnabled(e.target.value === "yes")}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                >
                  <option value="yes">Enabled (Show in Booking Step 2)</option>
                  <option value="no">Disabled (Hide from Booking)</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                disabled={isSubmitting}
                onClick={() =>
                  handleAction("update_mapping", {
                    newspaperId: selectedMappingNewspaper,
                    locationId: selectedMappingLocation,
                    isEnabled: mappingEnabled,
                  })
                }
                className="rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Mapping"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING RULES */}
        {activeTab === "pricing" && (
          <div className="mt-8 rounded-xl border border-brand-border bg-brand-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <Calculator className="h-5 w-5 text-brand-blue" /> Set Rate Card & Pricing Rules
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              Configure base charges and extra word / area rates in rupees (stored securely as integer paise on the server).
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-brand-text">Newspaper</label>
                <select
                  value={pricingNewspaper}
                  onChange={(e) => setPricingNewspaper(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                >
                  {NEWSPAPERS.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Advertisement Format</label>
                <select
                  value={pricingFormat}
                  onChange={(e) => setPricingFormat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                >
                  {FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Base Charge (₹)</label>
                <input
                  type="number"
                  value={baseChargeRupees}
                  onChange={(e) => setBaseChargeRupees(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Included Words (for Classifieds)</label>
                <input
                  type="number"
                  value={includedWords}
                  onChange={(e) => setIncludedWords(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Extra Word Rate (₹ per word)</label>
                <input
                  type="number"
                  value={extraWordRateRupees}
                  onChange={(e) => setExtraWordRateRupees(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Area Rate (₹ per sq. cm for Display)</label>
                <input
                  type="number"
                  value={ratePerSqCmRupees}
                  onChange={(e) => setRatePerSqCmRupees(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Colour Surcharge (%)</label>
                <input
                  type="number"
                  value={colorSurchargePercent}
                  onChange={(e) => setColorSurchargePercent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Box Border Add-on (₹)</label>
                <input
                  type="number"
                  value={boxBorderAddonRupees}
                  onChange={(e) => setBoxBorderAddonRupees(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">GST Percent (%)</label>
                <input
                  type="number"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                disabled={isSubmitting}
                onClick={() =>
                  handleAction("save_pricing_rule", {
                    newspaperId: pricingNewspaper,
                    formatId: pricingFormat,
                    baseChargeRupees,
                    includedWords,
                    extraWordRateRupees,
                    ratePerSqCmRupees,
                    colorSurchargePercent,
                    boxBorderAddonRupees,
                    gstPercent,
                  })
                }
                className="rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Pricing Rule"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DATE AVAILABILITY */}
        {activeTab === "availability" && (
          <div className="mt-8 rounded-xl border border-brand-border bg-brand-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-blue" /> Open Publication Date & Cut-off
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              Configure open calendar slots and booking cut-off hours prior to print publication.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-brand-text">Newspaper</label>
                <select
                  value={availNewspaper}
                  onChange={(e) => setAvailNewspaper(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                >
                  {NEWSPAPERS.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Publication Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={availDate}
                  onChange={(e) => setAvailDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Date Surcharge (₹)</label>
                <input
                  type="number"
                  value={dateSurchargeRupees}
                  onChange={(e) => setDateSurchargeRupees(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Maximum Ad Slots Available</label>
                <input
                  type="number"
                  value={maxSlots}
                  onChange={(e) => setMaxSlots(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text">Cut-off Hours Before Publication</label>
                <input
                  type="number"
                  value={cutoffHours}
                  onChange={(e) => setCutoffHours(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                disabled={isSubmitting}
                onClick={() =>
                  handleAction("open_date_slot", {
                    newspaperId: availNewspaper,
                    date: availDate,
                    maxSlots,
                    cutoffHoursBeforePublication: cutoffHours,
                    dateSurchargeRupees,
                  })
                }
                className="rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-50"
              >
                {isSubmitting ? "Opening Slot..." : "Open Publication Slot"}
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
"use client";

import { useState } from "react";

export function PrintControls() {
  const [error, setError] = useState("");
  function print() {
    setError("");
    try { window.print(); }
    catch { setError("Couldn't open the print dialog. Use your browser's Print menu and choose Save as PDF."); }
  }
  return <div className="print:hidden">
    <button className="button-primary" onClick={print}>Print / Save as PDF</button>
    <p className="mt-3 text-sm leading-6 text-slate-500">Choose <strong>Save as PDF</strong> as the destination, or print a paper copy. Use A4 or Letter and turn off browser headers and footers for a cleaner document.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
  </div>;
}

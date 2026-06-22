import { jsPDF } from "jspdf";

const WARD_NAME = {
  general: "General Ward", semi_cabin: "Semi-Cabin",
  cabin: "Private Cabin", icu: "ICU", emergency: "Emergency Bay",
};
const WARD_RATE = { general: 2500, semi_cabin: 5000, cabin: 10000, icu: 25000, emergency: 15000 };
const PAY_NAME  = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket", card: "Card" };

function padId(id) { return "SL-" + String(id).padStart(6, "0"); }

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return String(d); }
}

function fmtDateTime(d) {
  if (!d) return new Date().toLocaleString("en-GB");
  try { return new Date(d).toLocaleString("en-GB", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return String(d); }
}

// ── drawing helpers ────────────────────────────────────────────────────────

function setColor(doc, r, g, b, target = "text") {
  if (target === "fill") doc.setFillColor(r, g, b);
  else if (target === "draw") doc.setDrawColor(r, g, b);
  else doc.setTextColor(r, g, b);
}

function sectionBar(doc, title, y) {
  setColor(doc, 241, 245, 249, "fill");
  doc.rect(12, y, 186, 8, "F");
  setColor(doc, 100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 16, y + 5.5);
  return y + 11;
}

function row(doc, label, value, y) {
  const v = value == null || value === "" ? "—" : String(value);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setColor(doc, 100, 116, 139);
  doc.text(label, 16, y);
  doc.setFont("helvetica", "bold");
  setColor(doc, 30, 30, 46);
  const lines = doc.splitTextToSize(v, 118);
  doc.text(lines, 82, y);
  return y + Math.max(lines.length * 5.2, 6.5);
}

function divider(doc, y) {
  setColor(doc, 220, 225, 235, "draw");
  doc.setLineWidth(0.25);
  doc.line(12, y, 198, y);
  return y + 5;
}

function topHeader(doc, slipType, bookingId, isPrivate) {
  // Red bar
  setColor(doc, 220, 38, 38, "fill");
  doc.rect(0, 0, 210, 22, "F");

  // Brand
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  setColor(doc, 255, 255, 255);
  doc.text("SaveLife", 15, 15);

  // Divider
  doc.setFontSize(14);
  setColor(doc, 255, 160, 160);
  doc.text("|", 62, 15);

  // Slip title
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  setColor(doc, 255, 255, 255);
  doc.text(slipType, 68, 15);

  // Right side
  doc.setFontSize(8);
  setColor(doc, 255, 200, 200);
  doc.text("Ref: " + padId(bookingId), 145, 10);
  doc.text("Generated: " + fmtDateTime(new Date()), 145, 16);

  // Type strip
  const [sr, sg, sb] = isPrivate ? [124, 58, 237] : [22, 163, 74];
  setColor(doc, sr, sg, sb, "fill");
  doc.rect(0, 22, 210, 9, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(doc, 255, 255, 255);
  const stripText = isPrivate
    ? "PRIVATE HOSPITAL  —  50% ADVANCE PAYMENT RECEIVED"
    : "GOVERNMENT / PUBLIC HOSPITAL  —  NO PAYMENT REQUIRED";
  doc.text(stripText, 15, 28);

  return 35;
}

// ── public exports ─────────────────────────────────────────────────────────

export function generatePrivateSlip(booking, hospital, payInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = topHeader(doc, "Payment Receipt", booking.id, true);

  y += 3;

  // Hospital
  y = sectionBar(doc, "Hospital", y);
  y = row(doc, "Hospital Name",  hospital.name || booking.hospital_name || "—", y);
  y = row(doc, "City",           hospital.city || "—", y);
  y = row(doc, "Address",        hospital.address || "—", y);
  y = row(doc, "Phone",          hospital.phone || "—", y);
  y = row(doc, "Type",           "Private Hospital", y);

  y = divider(doc, y + 1);

  // Patient
  y = sectionBar(doc, "Patient Information", y);
  y = row(doc, "Patient Name",   booking.patient_name || "—", y);
  y = row(doc, "Age",            booking.patient_age ? booking.patient_age + " years" : "—", y);
  y = row(doc, "Gender",         booking.patient_gender || "—", y);
  if (booking.patient_nid) y = row(doc, "NID / Passport", booking.patient_nid, y);
  y = row(doc, "Contact Phone",  booking.contact_phone || "—", y);

  y = divider(doc, y + 1);

  // Admission
  y = sectionBar(doc, "Admission Details", y);
  y = row(doc, "Ward / Room Type", WARD_NAME[booking.ward_type] || booking.ward_type || "General Ward", y);
  y = row(doc, "Admission Type", (booking.admission_type || "planned").replace("_", " "), y);
  y = row(doc, "Preferred Date", fmtDate(booking.booking_date), y);
  y = row(doc, "Expected Stay",  (booking.expected_days || 1) + " day(s)", y);
  y = row(doc, "Reason",         booking.reason || "—", y);
  if (booking.symptoms)       y = row(doc, "Symptoms",         booking.symptoms, y);
  if (booking.referred_doctor) y = row(doc, "Referring Doctor", booking.referred_doctor, y);

  y = divider(doc, y + 1);

  // Emergency contact
  if (booking.emergency_contact_name) {
    y = sectionBar(doc, "Emergency Contact", y);
    y = row(doc, "Name",          booking.emergency_contact_name, y);
    y = row(doc, "Phone",         booking.emergency_contact_phone || "—", y);
    y = row(doc, "Relationship",  booking.emergency_contact_rel || "—", y);
    if (booking.insurance_provider) y = row(doc, "Insurance", booking.insurance_provider, y);
    y = divider(doc, y + 1);
  }

  // Payment
  const nights  = parseInt(booking.expected_days, 10) || 1;
  const rate    = WARD_RATE[booking.ward_type] || 0;
  const total   = rate * nights;
  const advance = booking.advance_amount ? Number(booking.advance_amount) : Math.round(total * 0.5);
  const balance = total - advance;
  const method  = payInfo?.method || booking.payment_method || "";
  const txnRef  = payInfo?.ref    || booking.payment_ref    || "—";

  y = sectionBar(doc, "Payment Receipt", y);

  // Highlight box for totals
  setColor(doc, 240, 253, 244, "fill");
  doc.rect(12, y, 186, 32, "F");
  setColor(doc, 22, 163, 74, "draw");
  doc.setLineWidth(0.4);
  doc.rect(12, y, 186, 32, "S");
  y += 4;

  y = row(doc, "Ward Rate",        "BDT " + rate.toLocaleString() + " / night", y);
  y = row(doc, "Duration",         nights + " night(s)", y);
  y = row(doc, "Total Estimate",   "BDT " + total.toLocaleString(), y);

  setColor(doc, 220, 225, 235, "draw");
  doc.setLineWidth(0.25);
  doc.line(16, y, 194, y);
  y += 4;

  // Bold advance paid line
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, 100, 116, 139);
  doc.text("Advance Paid (50%):", 16, y);
  setColor(doc, 22, 163, 74);
  doc.text("BDT " + advance.toLocaleString(), 82, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setColor(doc, 100, 116, 139);
  doc.text("Remaining Balance:", 16, y);
  doc.setFont("helvetica", "bold");
  setColor(doc, 217, 119, 6);
  doc.text("BDT " + balance.toLocaleString() + "  (payable at admission)", 82, y);
  y += 9;

  y = row(doc, "Payment Method",  PAY_NAME[method] || method || "—", y);
  y = row(doc, "Transaction Ref", txnRef, y);
  y = row(doc, "Payment Date",    fmtDateTime(new Date()), y);
  y = row(doc, "Booking Status",  (booking.status || "confirmed").toUpperCase(), y);

  // Note box
  y += 3;
  setColor(doc, 255, 251, 235, "fill");
  doc.rect(12, y, 186, 10, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(doc, 146, 64, 14);
  doc.text("Note: Please pay the remaining BDT " + balance.toLocaleString() + " at the hospital reception on your admission date.", 16, y + 6.5);
  y += 14;

  // Footer
  y = Math.max(y + 6, 272);
  setColor(doc, 220, 225, 235, "draw");
  doc.setLineWidth(0.3);
  doc.line(12, y, 198, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  setColor(doc, 150, 160, 175);
  doc.text("This is a computer-generated receipt and does not require a physical signature.", 15, y);
  doc.text("SaveLife Health Platform  •  For queries contact the hospital directly.", 15, y + 5);

  doc.save("SaveLife-Receipt-" + padId(booking.id) + ".pdf");
}

export function generatePublicSlip(booking, hospital) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = topHeader(doc, "Booking Confirmation", booking.id, false);

  y += 3;

  // Green confirmation banner
  setColor(doc, 220, 252, 231, "fill");
  doc.rect(12, y, 186, 16, "F");
  setColor(doc, 22, 163, 74, "draw");
  doc.setLineWidth(0.4);
  doc.rect(12, y, 186, 16, "S");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(doc, 20, 83, 45);
  doc.text("Booking Confirmed  —  " + padId(booking.id), 16, y + 7);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Present this slip at reception on your admission date. No payment is required.", 16, y + 13);
  y += 20;

  // Hospital
  y = sectionBar(doc, "Hospital", y);
  y = row(doc, "Hospital Name", hospital.name || booking.hospital_name || "—", y);
  y = row(doc, "Type",          "Government / Public Hospital (Free Services)", y);
  y = row(doc, "City",          hospital.city || "—", y);
  y = row(doc, "Address",       hospital.address || "—", y);
  y = row(doc, "Phone",         hospital.phone || "—", y);

  y = divider(doc, y + 1);

  // Patient
  y = sectionBar(doc, "Patient Information", y);
  y = row(doc, "Patient Name",  booking.patient_name || "—", y);
  y = row(doc, "Age",           booking.patient_age ? booking.patient_age + " years" : "—", y);
  y = row(doc, "Gender",        booking.patient_gender || "—", y);
  if (booking.patient_nid) y = row(doc, "NID / Passport", booking.patient_nid, y);
  y = row(doc, "Contact Phone", booking.contact_phone || "—", y);

  y = divider(doc, y + 1);

  // Admission
  y = sectionBar(doc, "Admission Details", y);
  y = row(doc, "Ward / Room Type", WARD_NAME[booking.ward_type] || booking.ward_type || "General Ward", y);
  y = row(doc, "Admission Type", (booking.admission_type || "planned").replace("_", " "), y);
  y = row(doc, "Preferred Date", fmtDate(booking.booking_date), y);
  y = row(doc, "Expected Stay",  (booking.expected_days || 1) + " day(s)", y);
  y = row(doc, "Reason",         booking.reason || "—", y);
  if (booking.symptoms)        y = row(doc, "Symptoms",         booking.symptoms, y);
  if (booking.referred_doctor) y = row(doc, "Referring Doctor", booking.referred_doctor, y);

  y = divider(doc, y + 1);

  // Emergency contact
  if (booking.emergency_contact_name) {
    y = sectionBar(doc, "Emergency Contact", y);
    y = row(doc, "Name",          booking.emergency_contact_name, y);
    y = row(doc, "Phone",         booking.emergency_contact_phone || "—", y);
    y = row(doc, "Relationship",  booking.emergency_contact_rel || "—", y);
    y = divider(doc, y + 1);
  }

  // Booking status
  y = sectionBar(doc, "Booking Status", y);
  y = row(doc, "Status",       (booking.status || "pending").toUpperCase(), y);
  y = row(doc, "Payment",      "Not required — Free public hospital", y);
  y = row(doc, "Booked On",    fmtDateTime(booking.created_at || new Date()), y);

  // Footer
  y = Math.max(y + 6, 272);
  setColor(doc, 220, 225, 235, "draw");
  doc.setLineWidth(0.3);
  doc.line(12, y, 198, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  setColor(doc, 150, 160, 175);
  doc.text("This is a computer-generated document and does not require a physical signature.", 15, y);
  doc.text("SaveLife Health Platform  •  For queries contact the hospital directly.", 15, y + 5);

  doc.save("SaveLife-Booking-" + padId(booking.id) + ".pdf");
}

// Email notifications via Gmail SMTP + nodemailer.
// Sends to ANY recipient email address — no domain required.
// Set EMAIL_USER + EMAIL_PASS (Gmail App Password) in backend/.env.

import nodemailer from "nodemailer";

let _transporter = null;

function transport() {
  if (_transporter) return _transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  // Gmail app passwords are shown with spaces (xxxx xxxx xxxx xxxx) but must be used without
  const pass = process.env.EMAIL_PASS.replace(/\s+/g, "");
  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass },
  });
  return _transporter;
}

export function emailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

async function send({ to, subject, html, text }) {
  const t = transport();
  if (!t) {
    console.warn("[email] EMAIL_USER/EMAIL_PASS not set — notification skipped");
    return;
  }
  await t.sendMail({
    from: `"SaveLife" <${process.env.EMAIL_USER}>`,
    to,
    replyTo: process.env.EMAIL_USER,
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      "X-Priority": "1",
      "Importance": "High",
      "Precedence": "transactional",
    },
  });
  console.log(`[email] "${subject}" → ${to}`);
}

// Notify the requester that a donor accepted their blood/plasma request.
export async function sendDonorAcceptedEmail({
  toEmail, toName,
  donorName, donorPhone,
  bloodType, donationType, units, hospital,
}) {
  const label = {
    blood: "Blood", plasma: "Plasma",
    platelets: "Platelets", whole_blood: "Whole Blood",
  }[donationType] || "Blood";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SaveLife Notification</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:8px;overflow:hidden;
                  border:1px solid #e0e0e0;max-width:520px;">

      <!-- Header -->
      <tr>
        <td style="background:#c0392b;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;
                     letter-spacing:0.5px;">SaveLife</h1>
          <p style="margin:6px 0 0;color:#f8d7d7;font-size:13px;">
            Blood Donation Network
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:18px;">
            A donor has accepted your request
          </h2>
          <p style="margin:0 0 24px;color:#444444;font-size:15px;line-height:1.6;">
            Hi <strong>${toName}</strong>, a donor has responded to your
            <strong>${label}</strong> request on SaveLife. Please contact them
            as soon as possible.
          </p>

          <!-- Donor info -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef9f9;border:1px solid #f5c6c6;
                        border-radius:6px;margin-bottom:20px;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 4px;color:#888;font-size:11px;
                          text-transform:uppercase;letter-spacing:0.8px;font-weight:bold;">
                  Donor
                </p>
                <p style="margin:0 0 8px;color:#1a1a1a;font-size:17px;font-weight:bold;">
                  ${donorName}
                </p>
                <p style="margin:0;color:#1a1a1a;font-size:16px;font-weight:bold;">
                  Phone: ${donorPhone}
                </p>
              </td>
            </tr>
          </table>

          <!-- Request summary -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9f9f9;border:1px solid #e0e0e0;
                        border-radius:6px;margin-bottom:28px;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 4px;color:#888;font-size:11px;
                          text-transform:uppercase;letter-spacing:0.8px;font-weight:bold;">
                  Your Request
                </p>
                <p style="margin:0 0 4px;color:#1a1a1a;font-size:15px;">
                  <strong>${bloodType}</strong> — ${label},
                  ${units} unit${units > 1 ? "s" : ""}
                </p>
                ${hospital
                  ? `<p style="margin:4px 0 0;color:#555;font-size:14px;">Hospital: ${hospital}</p>`
                  : ""}
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="tel:${donorPhone}"
                   style="display:inline-block;background:#c0392b;color:#ffffff;
                          text-decoration:none;padding:14px 40px;border-radius:6px;
                          font-size:15px;font-weight:bold;">
                  Call ${donorName}: ${donorPhone}
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.6;
                    text-align:center;">
            Every minute matters. Please reach out to the donor right away.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e0e0e0;
                   text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;">
            You received this because you posted a blood request on SaveLife.<br>
            To unsubscribe, reply with "unsubscribe" in the subject.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text =
    `Hi ${toName},\n\n` +
    `${donorName} accepted your ${label} request on SaveLife.\n\n` +
    `Donor contact: ${donorPhone}\n` +
    `Request: ${bloodType} ${label}, ${units} unit(s)` +
    (hospital ? ` at ${hospital}` : "") + `\n\n` +
    `Please reach out as soon as possible.\n\n— SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife: ${donorName} accepted your ${bloodType} ${label} request`,
    html,
    text,
  });
}

// Send order confirmation email after a medicine/pharmacy order is placed.
export async function sendOrderConfirmationEmail({ toEmail, toName, order, items }) {
  const orderId = `ORD-${String(order.id).padStart(6, "0")}`;
  const itemRows = items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e8f5f0;color:#1a1a1a;font-size:14px;">
            ${it.emoji || "💊"} ${it.name}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8f5f0;color:#555;font-size:14px;text-align:center;">
            ${it.unit || ""}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8f5f0;color:#555;font-size:14px;text-align:center;">
            ×${it.qty}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8f5f0;color:#059669;font-size:14px;font-weight:bold;text-align:right;">
            ৳${(it.price * it.qty).toFixed(0)}
          </td>
        </tr>`
    )
    .join("");

  const paymentNote =
    order.payment_method === "COD"
      ? "Pay in cash when your order arrives at your door."
      : `Pay via <strong>${order.payment_method}</strong> to our merchant number after our team confirms your order.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 0;">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;
                  border:1px solid #d1fae5;max-width:540px;">

      <!-- Header -->
      <tr>
        <td style="background:#059669;padding:26px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">
            💊 SaveLife Pharmacy
          </h1>
          <p style="margin:6px 0 0;color:#a7f3d0;font-size:13px;">
            Your health, delivered to your door
          </p>
        </td>
      </tr>

      <!-- Confirmation banner -->
      <tr>
        <td style="background:#ecfdf5;padding:18px 32px;border-bottom:1px solid #d1fae5;text-align:center;">
          <p style="margin:0;font-size:20px;">✅</p>
          <h2 style="margin:6px 0 0;color:#065f46;font-size:17px;font-weight:bold;">
            Order Confirmed!
          </h2>
          <p style="margin:4px 0 0;color:#059669;font-size:13px;font-weight:bold;
                    font-family:monospace;letter-spacing:0.06em;">
            ${orderId}
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, thank you for your order from
            <strong>SaveLife Pharmacy</strong>. We have received your order and
            it will be processed shortly.
          </p>

          <!-- Items table -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #d1fae5;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            <thead>
              <tr style="background:#f0fdf4;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;
                           text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-weight:700;">
                  Product
                </th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;
                           text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-weight:700;">
                  Unit
                </th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;
                           text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-weight:700;">
                  Qty
                </th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;
                           text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-weight:700;">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr style="background:#f0fdf4;">
                <td colspan="3" style="padding:12px;font-size:14px;font-weight:bold;color:#065f46;">
                  Total
                </td>
                <td style="padding:12px;font-size:16px;font-weight:bold;color:#059669;text-align:right;">
                  ৳${Number(order.total).toFixed(0)}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Details -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;
                          letter-spacing:0.06em;color:#9ca3af;font-weight:700;">Delivery Address</p>
                <p style="margin:0 0 14px;color:#1f2937;font-size:14px;line-height:1.5;">${order.address}</p>
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;
                          letter-spacing:0.06em;color:#9ca3af;font-weight:700;">Payment</p>
                <p style="margin:0 0 14px;color:#1f2937;font-size:14px;">${paymentNote}</p>
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;
                          letter-spacing:0.06em;color:#9ca3af;font-weight:700;">Estimated Delivery</p>
                <p style="margin:0;color:#1f2937;font-size:14px;">🚚 2–3 business days</p>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            Questions? Contact us at
            <a href="mailto:support@savelife.org" style="color:#059669;">support@savelife.org</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            SaveLife Pharmacy · Bangladesh<br>
            To unsubscribe, reply with "unsubscribe" in the subject.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text =
    `Hi ${toName},\n\nYour SaveLife Pharmacy order ${orderId} has been confirmed!\n\n` +
    `Items:\n` +
    items.map((it) => `  • ${it.name} ×${it.qty} — ৳${(it.price * it.qty).toFixed(0)}`).join("\n") +
    `\n\nTotal: ৳${Number(order.total).toFixed(0)}` +
    `\nDelivery: ${order.address}` +
    `\nPayment: ${order.payment_method}` +
    `\nEstimated delivery: 2–3 business days\n\n— SaveLife Pharmacy`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife Pharmacy — Order Confirmed: ${orderId}`,
    html,
    text,
  });
}

// Welcome email sent on account creation.
export async function sendWelcomeEmail({ toEmail, toName, userCode, bloodType }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #fecaca;max-width:520px;">
      <tr>
        <td style="background:#c0392b;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:0.5px;">❤️ SaveLife</h1>
          <p style="margin:8px 0 0;color:#fca5a5;font-size:13px;">Bangladesh Blood Donation Network</p>
        </td>
      </tr>
      <tr>
        <td style="background:#fef2f2;padding:18px 32px;border-bottom:1px solid #fecaca;text-align:center;">
          <p style="margin:0;font-size:22px;">🎉</p>
          <h2 style="margin:6px 0 0;color:#991b1b;font-size:17px;font-weight:bold;">Welcome to SaveLife!</h2>
          <p style="margin:4px 0 0;color:#b91c1c;font-size:13px;">Your account has been created successfully</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, thank you for joining <strong>SaveLife</strong> — Bangladesh's
            blood donation network. Your registration is complete and you can now donate, request blood,
            and access all our services.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;font-weight:700;">Your Donor ID</p>
                <p style="margin:0 0 4px;color:#1f2937;font-size:22px;font-weight:bold;font-family:monospace;letter-spacing:0.08em;">${userCode}</p>
                <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Save this — you can use it to log in</p>
                ${bloodType ? `<hr style="border:none;border-top:1px solid #fecaca;margin:12px 0;">
                <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;font-weight:700;">Blood Group</p>
                <p style="margin:4px 0 0;color:#c0392b;font-size:20px;font-weight:bold;">${bloodType}</p>` : ""}
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 10px;font-size:13px;color:#374151;font-weight:bold;">What you can do on SaveLife:</p>
                <p style="margin:0 0 6px;color:#4b5563;font-size:14px;">🩸 Donate blood or plasma to people in need</p>
                <p style="margin:0 0 6px;color:#4b5563;font-size:14px;">📢 Request blood for yourself or a patient</p>
                <p style="margin:0 0 6px;color:#4b5563;font-size:14px;">🏥 Book hospital admissions & ambulance</p>
                <p style="margin:0 0 6px;color:#4b5563;font-size:14px;">👨‍⚕️ Find & book doctors</p>
                <p style="margin:0;color:#4b5563;font-size:14px;">💊 Order medicines & health products</p>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            Every drop counts. Thank you for being a lifesaver.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            SaveLife Blood Donation Network · Bangladesh<br>
            To unsubscribe, reply with "unsubscribe" in the subject.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `Hi ${toName},\n\nWelcome to SaveLife — Bangladesh's blood donation network!\n\n` +
    `Your Donor ID: ${userCode}\n` +
    (bloodType ? `Blood Group: ${bloodType}\n` : "") +
    `\nYou can now donate blood, request blood, book hospitals, find doctors, and order medicines.\n\n— SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `Welcome to SaveLife, ${toName}! Your Donor ID: ${userCode}`,
    html,
    text,
  });
}

// Confirmation email when a blood request is posted.
export async function sendBloodRequestEmail({ toEmail, toName, request }) {
  const label = {
    blood: "Blood", plasma: "Plasma",
    platelets: "Platelets", whole_blood: "Whole Blood",
  }[request.donation_type] || "Blood";
  const urgencyBadge = {
    critical: "🔴 CRITICAL",
    urgent:   "🟠 URGENT",
    normal:   "🟢 Normal",
  }[request.urgency] || request.urgency;
  const reqId = `REQ-${String(request.id).padStart(6, "0")}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #fecaca;max-width:520px;">
      <tr>
        <td style="background:#c0392b;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">SaveLife</h1>
          <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;">Blood Donation Network</p>
        </td>
      </tr>
      <tr>
        <td style="background:#fef2f2;padding:16px 32px;border-bottom:1px solid #fecaca;text-align:center;">
          <p style="margin:0;font-size:20px;">📢</p>
          <h2 style="margin:6px 0 0;color:#991b1b;font-size:17px;font-weight:bold;">Blood Request Posted</h2>
          <p style="margin:4px 0 0;color:#b91c1c;font-size:12px;font-weight:bold;font-family:monospace;letter-spacing:0.06em;">${reqId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, your blood request has been posted on SaveLife.
            We will notify you as soon as a donor responds.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Patient</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:17px;font-weight:bold;">${request.patient_name}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Blood Type &amp; Donation</p>
                <p style="margin:0 0 12px;color:#c0392b;font-size:18px;font-weight:bold;">${request.blood_type} — ${label}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Units Needed</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${request.units_needed} unit${request.units_needed > 1 ? "s" : ""}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Urgency</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${urgencyBadge}</p>
                ${request.hospital ? `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Hospital</p>
                <p style="margin:0;color:#1f2937;font-size:14px;">${request.hospital}</p>` : ""}
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            You will receive another email the moment a donor accepts this request.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SaveLife Blood Donation Network · Bangladesh</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `Hi ${toName},\n\nYour blood request ${reqId} has been posted on SaveLife.\n\n` +
    `Patient: ${request.patient_name}\n` +
    `Blood Type: ${request.blood_type} (${label})\n` +
    `Units: ${request.units_needed}\nUrgency: ${request.urgency}\n` +
    (request.hospital ? `Hospital: ${request.hospital}\n` : "") +
    `\nWe'll email you when a donor responds.\n\n— SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife: Your ${request.blood_type} ${label} request (${reqId}) is live`,
    html,
    text,
  });
}

// Thank-you email to the DONOR when they agree to donate (contact revealed).
export async function sendDonorThankYouEmail({ toEmail, toName, bloodType, donationType, patientName, hospital }) {
  const label = {
    blood: "Blood", plasma: "Plasma",
    platelets: "Platelets", whole_blood: "Whole Blood",
  }[donationType] || "Blood";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #fecaca;max-width:520px;">
      <tr>
        <td style="background:#c0392b;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">SaveLife</h1>
          <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;">Blood Donation Network</p>
        </td>
      </tr>
      <tr>
        <td style="background:#fef2f2;padding:16px 32px;border-bottom:1px solid #fecaca;text-align:center;">
          <p style="margin:0;font-size:26px;">🩸</p>
          <h2 style="margin:6px 0 0;color:#991b1b;font-size:17px;font-weight:bold;">Thank You for Donating!</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, you are a hero! 🦸 You have agreed to donate
            <strong>${label}</strong> on SaveLife. The requester has been notified and
            will be contacting you shortly.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Patient</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${patientName}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Donation Type</p>
                <p style="margin:0 0 12px;color:#c0392b;font-size:16px;font-weight:bold;">${bloodType} ${label}</p>
                ${hospital ? `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Hospital</p>
                <p style="margin:0;color:#1f2937;font-size:14px;">${hospital}</p>` : ""}
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            Your generosity saves lives. Thank you from the entire SaveLife community. ❤️
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SaveLife Blood Donation Network · Bangladesh</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `Hi ${toName},\n\nThank you for agreeing to donate ${label} on SaveLife!\n\n` +
    `Patient: ${patientName}\nDonation: ${bloodType} ${label}\n` +
    (hospital ? `Hospital: ${hospital}\n` : "") +
    `\nThe requester has been notified and will contact you shortly.\n\nThank you for saving a life! ❤️\n\n— SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife: Thank you for donating ${bloodType} ${label}!`,
    html,
    text,
  });
}

// Hospital booking confirmation email.
export async function sendHospitalBookingEmail({ toEmail, toName, booking, hospitalName }) {
  const bookingId = `HB-${String(booking.id).padStart(6, "0")}`;
  const statusBadge = booking.status === "confirmed" ? "✅ Confirmed" : "⏳ Pending Review";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eff6ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #bfdbfe;max-width:520px;">
      <tr>
        <td style="background:#1d4ed8;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">🏥 SaveLife</h1>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Hospital Booking Service</p>
        </td>
      </tr>
      <tr>
        <td style="background:#eff6ff;padding:16px 32px;border-bottom:1px solid #bfdbfe;text-align:center;">
          <p style="margin:0;font-size:20px;">🏥</p>
          <h2 style="margin:6px 0 0;color:#1e3a8a;font-size:17px;font-weight:bold;">Booking ${statusBadge}</h2>
          <p style="margin:4px 0 0;color:#2563eb;font-size:12px;font-weight:bold;font-family:monospace;letter-spacing:0.06em;">${bookingId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, your hospital booking at
            <strong>${hospitalName}</strong> has been received.
            ${booking.status === "confirmed"
              ? "Your booking is confirmed — please arrive on time."
              : "Our team will review and confirm your booking shortly."}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Hospital</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:17px;font-weight:bold;">${hospitalName}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Patient</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${booking.patient_name}${booking.patient_age ? `, ${booking.patient_age} yrs` : ""}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Ward Type</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${booking.ward_type || "General"}</p>
                ${booking.booking_date ? `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Admission Date</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${new Date(booking.booking_date).toLocaleDateString("en-GB", { day:"numeric",month:"long",year:"numeric" })}</p>` : ""}
                ${booking.advance_paid && booking.advance_amount > 0 ? `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Advance Paid</p>
                <p style="margin:0;color:#1d4ed8;font-size:15px;font-weight:bold;">৳${Number(booking.advance_amount).toFixed(0)} (${booking.payment_method || ""})</p>` : ""}
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            Please bring this email and your NID/passport on admission day.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SaveLife Hospital Services · Bangladesh</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `Hi ${toName},\n\nYour hospital booking ${bookingId} has been ${booking.status}.\n\n` +
    `Hospital: ${hospitalName}\n` +
    `Patient: ${booking.patient_name}\n` +
    `Ward: ${booking.ward_type || "General"}\n` +
    (booking.booking_date ? `Admission Date: ${booking.booking_date}\n` : "") +
    (booking.advance_paid && booking.advance_amount > 0 ? `Advance Paid: ৳${Number(booking.advance_amount).toFixed(0)}\n` : "") +
    `\nPlease bring this email and your ID on admission day.\n\n— SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife Hospital Booking ${statusBadge}: ${bookingId} — ${hospitalName}`,
    html,
    text,
  });
}

// Doctor appointment confirmation email.
export async function sendDoctorAppointmentEmail({ toEmail, toName, appointment, doctor }) {
  const apptId = `APT-${String(appointment.id).padStart(6, "0")}`;
  const apptDate = appointment.appointment_date
    ? new Date(appointment.appointment_date).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    : "TBD";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #bbf7d0;max-width:520px;">
      <tr>
        <td style="background:#15803d;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">👨‍⚕️ SaveLife</h1>
          <p style="margin:6px 0 0;color:#86efac;font-size:13px;">Doctor Appointment Service</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f0fdf4;padding:16px 32px;border-bottom:1px solid #bbf7d0;text-align:center;">
          <p style="margin:0;font-size:20px;">✅</p>
          <h2 style="margin:6px 0 0;color:#14532d;font-size:17px;font-weight:bold;">Appointment Confirmed</h2>
          <p style="margin:4px 0 0;color:#16a34a;font-size:12px;font-weight:bold;font-family:monospace;letter-spacing:0.06em;">${apptId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, your appointment with
            <strong>Dr. ${doctor?.name || "the doctor"}</strong> has been confirmed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Doctor</p>
                <p style="margin:0 0 4px;color:#1f2937;font-size:17px;font-weight:bold;">Dr. ${doctor?.name || "—"}</p>
                <p style="margin:0 0 12px;color:#16a34a;font-size:13px;">${doctor?.specialty || ""}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Patient</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${appointment.patient_name}${appointment.patient_age ? `, ${appointment.patient_age} yrs` : ""}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Date &amp; Time</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:bold;">${apptDate}${appointment.appointment_time ? " at " + appointment.appointment_time : ""}</p>
                ${doctor?.hospital ? `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Hospital</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:14px;">${doctor.hospital}${doctor.city ? ", " + doctor.city : ""}</p>` : ""}
                ${doctor?.consultation_fee ? `<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Consultation Fee</p>
                <p style="margin:0;color:#15803d;font-size:15px;font-weight:bold;">৳${doctor.consultation_fee}</p>` : ""}
              </td>
            </tr>
          </table>
          ${appointment.reason ? `<table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:14px 20px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Reason for Visit</p>
                <p style="margin:0;color:#374151;font-size:14px;">${appointment.reason}</p>
              </td>
            </tr>
          </table>` : ""}
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            Please arrive 15 minutes early and bring any previous medical records.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SaveLife Doctor Services · Bangladesh</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `Hi ${toName},\n\nYour appointment ${apptId} is confirmed!\n\n` +
    `Doctor: Dr. ${doctor?.name || "—"} (${doctor?.specialty || ""})\n` +
    `Patient: ${appointment.patient_name}\n` +
    `Date: ${apptDate}${appointment.appointment_time ? " at " + appointment.appointment_time : ""}\n` +
    (doctor?.hospital ? `Hospital: ${doctor.hospital}\n` : "") +
    (doctor?.consultation_fee ? `Fee: ৳${doctor.consultation_fee}\n` : "") +
    `\nPlease arrive 15 minutes early and bring any previous medical records.\n\n— SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife: Appointment Confirmed ${apptId} — Dr. ${doctor?.name || ""}`,
    html,
    text,
  });
}

// SOS alert email sent TO each emergency contact — tells them their friend needs help.
export async function sendSOSContactEmail({ toEmail, toName, fromName, fromPhone, fromEmail, location, mapsUrl }) {
  const time = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", hour12: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:3px solid #dc2626;max-width:520px;">
      <tr>
        <td style="background:#dc2626;padding:22px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:2px;">🚨 EMERGENCY SOS</h1>
          <p style="margin:8px 0 0;color:#fecaca;font-size:13px;">SaveLife Emergency Alert</p>
        </td>
      </tr>
      <tr>
        <td style="background:#fef2f2;padding:20px 32px;border-bottom:2px solid #fecaca;text-align:center;">
          <h2 style="margin:0;color:#991b1b;font-size:20px;font-weight:800;">
            ${fromName} needs emergency help!
          </h2>
          <p style="margin:8px 0 0;color:#b91c1c;font-size:13px;">${time}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 22px;color:#1f2937;font-size:16px;line-height:1.7;">
            Hi <strong>${toName}</strong>, you are listed as an emergency contact for
            <strong>${fromName}</strong> on SaveLife. They have triggered an
            <strong style="color:#dc2626;">SOS Emergency Alert</strong> and may need immediate assistance.
          </p>

          <!-- Person in distress -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef2f2;border:2px solid #dc2626;border-radius:10px;margin-bottom:18px;">
            <tr>
              <td style="padding:20px 22px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Person Who Needs Help</p>
                <p style="margin:0 0 10px;color:#1f2937;font-size:20px;font-weight:800;">${fromName}</p>
                <table width="100%"><tbody>
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:13px;width:60px;">Phone</td>
                    <td style="padding:4px 0;"><a href="tel:${fromPhone}" style="color:#dc2626;font-size:16px;font-weight:800;text-decoration:none;">${fromPhone}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td>
                    <td style="padding:4px 0;"><a href="mailto:${fromEmail}" style="color:#1d4ed8;font-size:14px;text-decoration:none;">${fromEmail}</a></td>
                  </tr>
                </tbody></table>
              </td>
            </tr>
          </table>

          <!-- Location -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:18px;">
            <tr>
              <td style="padding:18px 22px;">
                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">📍 Their Location</p>
                ${location?.latitude
                  ? `<p style="margin:0 0 10px;color:#1f2937;font-size:14px;font-family:monospace;font-weight:bold;">
                      ${Number(location.latitude).toFixed(5)}°N, ${Number(location.longitude).toFixed(5)}°E
                    </p>
                    ${mapsUrl
                      ? `<a href="${mapsUrl}"
                           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                                  padding:12px 28px;border-radius:8px;font-size:15px;font-weight:700;">
                           📍 View Location on Google Maps
                         </a>`
                      : ""}`
                  : `<p style="margin:0;color:#6b7280;font-size:14px;">Location could not be determined — contact them directly.</p>`}
              </td>
            </tr>
          </table>

          <!-- Emergency numbers -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:22px;">
            <tr>
              <td style="padding:16px 22px;">
                <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Bangladesh Emergency Numbers</p>
                <table width="100%"><tbody>
                  <tr><td style="padding:3px 0;color:#1f2937;font-size:14px;">🚔 Police</td><td style="font-weight:800;color:#dc2626;font-size:18px;font-family:monospace;">999</td></tr>
                  <tr><td style="padding:3px 0;color:#1f2937;font-size:14px;">🚑 Ambulance</td><td style="font-weight:800;color:#dc2626;font-size:18px;font-family:monospace;">16430</td></tr>
                  <tr><td style="padding:3px 0;color:#1f2937;font-size:14px;">🚒 Fire</td><td style="font-weight:800;color:#dc2626;font-size:18px;font-family:monospace;">199</td></tr>
                </tbody></table>
              </td>
            </tr>
          </table>

          <p style="margin:0;background:#fef9c3;border:1px solid #fde047;border-radius:8px;
                    padding:14px 18px;color:#713f12;font-size:14px;line-height:1.6;font-weight:600;">
            ⚠️ Please try to contact <strong>${fromName}</strong> immediately.
            If you cannot reach them, call <strong>999</strong> and share their location above.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            You received this because ${fromName} listed you as an emergency contact on SaveLife.<br>
            SaveLife Emergency Network · Bangladesh
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `🚨 EMERGENCY — ${fromName} needs help!\n\n` +
    `Hi ${toName}, ${fromName} triggered an SOS alert on SaveLife at ${time}.\n\n` +
    `CONTACT THEM NOW:\n  Phone: ${fromPhone}\n  Email: ${fromEmail}\n\n` +
    (location?.latitude
      ? `Their Location:\n  ${Number(location.latitude).toFixed(5)}°N, ${Number(location.longitude).toFixed(5)}°E\n  ${mapsUrl || ""}\n\n`
      : "Location unavailable — contact them directly.\n\n") +
    `If you can't reach them, call 999 (Police) or 16430 (Ambulance).\n\n— SaveLife Emergency Network`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `🚨 EMERGENCY: ${fromName} needs help! — SaveLife SOS Alert`,
    html,
    text,
  });
}

// SOS alert notification sent to the user who raised the alert.
export async function sendSOSNotificationEmail({ toEmail, toName, location, mapsUrl, contacts }) {
  const time = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", hour12: true });
  const contactRows = (contacts || []).map(c =>
    `<tr>
      <td style="padding:7px 12px;border-bottom:1px solid #fca5a5;color:#1f2937;font-size:14px;font-weight:bold;">${c.name}${c.relationship ? ` (${c.relationship})` : ""}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #fca5a5;"><a href="tel:${c.phone}" style="color:#dc2626;font-weight:bold;">${c.phone}</a></td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:10px;overflow:hidden;border:2px solid #dc2626;max-width:520px;">
      <tr>
        <td style="background:#dc2626;padding:22px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:1px;">🚨 EMERGENCY SOS</h1>
          <p style="margin:6px 0 0;color:#fecaca;font-size:13px;">SaveLife Emergency Alert System</p>
        </td>
      </tr>
      <tr>
        <td style="background:#fef2f2;padding:16px 32px;border-bottom:1px solid #fecaca;text-align:center;">
          <h2 style="margin:0;color:#991b1b;font-size:16px;">Your SOS Alert Has Been Logged</h2>
          <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">${time}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">
            Hi <strong>${toName}</strong>, your emergency SOS alert was successfully logged on SaveLife.
            This is a confirmation email — keep it for reference.
          </p>

          <!-- Location -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">📍 Your Location</p>
                ${location?.latitude
                  ? `<p style="margin:0 0 8px;color:#1f2937;font-size:15px;font-weight:bold;font-family:monospace;">
                      ${Number(location.latitude).toFixed(5)}°N, ${Number(location.longitude).toFixed(5)}°E
                    </p>
                    ${mapsUrl ? `<a href="${mapsUrl}" style="color:#1d4ed8;font-size:14px;font-weight:bold;">📍 View on Google Maps ↗</a>` : ""}`
                  : `<p style="margin:0;color:#6b7280;font-size:14px;">Location was unavailable</p>`}
              </td>
            </tr>
          </table>

          <!-- Emergency numbers -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">📞 Bangladesh Emergency Numbers</p>
                <table width="100%"><tbody>
                  <tr>
                    <td style="padding:3px 0;color:#1f2937;font-size:14px;">🚔 Police</td>
                    <td style="font-weight:bold;color:#dc2626;font-size:16px;font-family:monospace;">999</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;color:#1f2937;font-size:14px;">🚑 Ambulance (DGHS)</td>
                    <td style="font-weight:bold;color:#dc2626;font-size:16px;font-family:monospace;">16430</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;color:#1f2937;font-size:14px;">🚒 Fire Service</td>
                    <td style="font-weight:bold;color:#dc2626;font-size:16px;font-family:monospace;">199</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;color:#1f2937;font-size:14px;">🏥 DGHS Hotline</td>
                    <td style="font-weight:bold;color:#dc2626;font-size:16px;font-family:monospace;">16257</td>
                  </tr>
                </tbody></table>
              </td>
            </tr>
          </table>

          ${contactRows ? `
          <!-- Emergency contacts -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #fecaca;border-radius:8px;overflow:hidden;margin-bottom:16px;">
            <thead><tr style="background:#fef2f2;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Your Emergency Contacts</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Phone</th>
            </tr></thead>
            <tbody>${contactRows}</tbody>
          </table>` : ""}

          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            If this was a false alarm, you can cancel the alert from the SaveLife app.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SaveLife Emergency Network · Bangladesh</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `🚨 SOS ALERT LOGGED — SaveLife\n\n` +
    `Hi ${toName}, your emergency SOS was logged at ${time}.\n\n` +
    (location?.latitude
      ? `Location: ${Number(location.latitude).toFixed(5)}°N, ${Number(location.longitude).toFixed(5)}°E\n${mapsUrl || ""}\n\n`
      : "Location unavailable\n\n") +
    `Bangladesh Emergency Numbers:\n  999 — Police\n  16430 — Ambulance\n  199 — Fire\n  16257 — DGHS\n\n` +
    ((contacts || []).length > 0
      ? `Your Contacts:\n${contacts.map(c => `  • ${c.name} — ${c.phone}`).join("\n")}\n\n`
      : "") +
    `Stay safe. — SaveLife`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `🚨 SOS Alert Logged — SaveLife Emergency`,
    html,
    text,
  });
}

// Organ donation pledge confirmation email.
export async function sendOrganPledgeEmail({ toEmail, toName, organs, pledgeDate, userCode }) {
  const certNo = `ODP-${userCode}`;
  const dateStr = pledgeDate
    ? new Date(pledgeDate).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" })
    : new Date().toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });

  const ORGAN_LABELS = {
    corneas:       "👁️ Corneas (Eyes)",
    kidneys:       "🫘 Kidneys",
    heart:         "🫀 Heart",
    lungs:         "🫁 Lungs",
    liver:         "🩺 Liver",
    pancreas:      "🔬 Pancreas",
    skin:          "🧬 Skin & Tissue",
    bone_marrow:   "🦴 Bone & Marrow",
    blood_vessels: "🩸 Blood Vessels",
    intestines:    "💚 Intestines",
  };

  const organRows = organs.map(o =>
    `<tr><td style="padding:8px 14px;border-bottom:1px solid #e9d5f5;font-size:14px;color:#1f2937;">${ORGAN_LABELS[o] || o}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 0;">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ddd6fe;max-width:540px;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:28px 32px;text-align:center;">
          <p style="margin:0 0 6px;font-size:2rem;">🎗️</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">SaveLife Foundation</h1>
          <p style="margin:6px 0 0;color:#ddd6fe;font-size:13px;">Organ Donation Programme · Bangladesh</p>
        </td>
      </tr>

      <!-- Banner -->
      <tr>
        <td style="background:#f5f3ff;padding:18px 32px;border-bottom:1px solid #ddd6fe;text-align:center;">
          <h2 style="margin:0;color:#4c1d95;font-size:18px;font-weight:bold;">Organ Donation Pledge Received ✅</h2>
          <p style="margin:6px 0 0;color:#7c3aed;font-size:12px;font-weight:bold;font-family:monospace;letter-spacing:0.08em;">${certNo}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
            Dear <strong>${toName}</strong>,<br><br>
            Thank you for taking this profound step. By pledging to donate your organs, you have
            chosen to give the greatest gift one human being can give another — the gift of life.
            SaveLife Foundation acknowledges your pledge with the deepest respect.
          </p>

          <!-- Pledged organs -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;margin-bottom:20px;overflow:hidden;">
            <thead>
              <tr style="background:#7c3aed;">
                <th style="padding:10px 14px;text-align:left;color:#fff;font-size:12px;
                           text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">
                  Organs You Have Pledged to Donate
                </th>
              </tr>
            </thead>
            <tbody>${organRows}</tbody>
          </table>

          <!-- Certificate info -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fdf4ff;border:1px solid #e9d5f5;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Certificate Number</p>
                <p style="margin:0 0 12px;color:#4c1d95;font-size:18px;font-weight:bold;font-family:monospace;">${certNo}</p>
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:700;">Pledge Date</p>
                <p style="margin:0;color:#1f2937;font-size:15px;font-weight:bold;">${dateStr}</p>
              </td>
            </tr>
          </table>

          <!-- IMPORTANT: Office visit -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fffbeb;border:2px solid #f59e0b;border-radius:10px;margin-bottom:20px;">
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">
                  ⚠️ Important — Next Step Required
                </p>
                <p style="margin:0 0 12px;color:#78350f;font-size:14px;line-height:1.65;">
                  This digital pledge is your <strong>first step</strong>. To make your pledge legally
                  binding and receive your official <strong>Organ Donor Card</strong>, you must visit
                  our office in person with the required documents.
                </p>
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1f2937;">📍 SaveLife Foundation Office</p>
                <p style="margin:0 0 4px;color:#374151;font-size:13px;">House 23, Road 11, Block C</p>
                <p style="margin:0 0 4px;color:#374151;font-size:13px;">Banani, Dhaka — 1213</p>
                <p style="margin:0 0 4px;color:#374151;font-size:13px;">📞 +880 2-55048123</p>
                <p style="margin:0 0 12px;color:#374151;font-size:13px;">🕘 Office Hours: Sunday–Thursday, 9AM–5PM</p>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1f2937;">Please bring:</p>
                <p style="margin:0 0 2px;color:#374151;font-size:13px;">✅ National ID Card (NID) — original + photocopy</p>
                <p style="margin:0 0 2px;color:#374151;font-size:13px;">✅ 2 passport-size photographs</p>
                <p style="margin:0 0 2px;color:#374151;font-size:13px;">✅ This pledge certificate (printed)</p>
                <p style="margin:0;color:#374151;font-size:13px;">✅ Family member's signature (parent / spouse)</p>
              </td>
            </tr>
          </table>

          <!-- Legal note -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
            <tr>
              <td style="padding:14px 18px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.06em;">Legal Framework</p>
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                  Organ donation in Bangladesh is governed by the
                  <em>Human Organ Transplantation Act, 1999</em> (amended 2018).
                  Family consent is required alongside your pledge. Our office will
                  guide you through the full legal registration process at no cost.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
            "One organ donor can save up to 8 lives and improve the lives of 50 more."<br>
            <em>Thank you for choosing to be that person.</em>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f5f3ff;padding:16px 32px;border-top:1px solid #ddd6fe;text-align:center;">
          <p style="margin:0;color:#7c3aed;font-size:12px;font-weight:700;">
            SaveLife Foundation · Organ Donation Programme
          </p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px;">
            House 23, Road 11, Block C, Banani, Dhaka-1213, Bangladesh<br>
            organ.pledge@savelife.org · +880 2-55048123
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  const text =
    `Dear ${toName},\n\n` +
    `Thank you for pledging to donate your organs with SaveLife Foundation.\n\n` +
    `Certificate No.: ${certNo}\nPledge Date: ${dateStr}\n\n` +
    `Organs Pledged:\n` + organs.map(o => `  • ${ORGAN_LABELS[o] || o}`).join("\n") +
    `\n\n⚠️ IMPORTANT — NEXT STEP:\n` +
    `Visit our office to make your pledge legally binding and receive your Donor Card:\n\n` +
    `SaveLife Foundation\nHouse 23, Road 11, Block C\nBanani, Dhaka — 1213\n` +
    `Phone: +880 2-55048123\nOffice Hours: Sun–Thu, 9AM–5PM\n\n` +
    `Please bring: NID card, 2 passport photos, this certificate (printed), family member's signature.\n\n` +
    `— SaveLife Foundation, Organ Donation Programme`;

  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: `SaveLife: Your Organ Donation Pledge Confirmed — ${certNo}`,
    html,
    text,
  });
}

// Send a test email to verify the setup is working.
export async function sendTestEmail(toEmail, toName) {
  if (!emailConfigured()) {
    throw new Error("EMAIL_USER / EMAIL_PASS not configured in backend/.env");
  }
  await send({
    to: `"${toName}" <${toEmail}>`,
    subject: "SaveLife: Email notifications confirmed",
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:8px;border:1px solid #e0e0e0;max-width:520px;">
      <tr>
        <td style="background:#c0392b;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">SaveLife</h1>
          <p style="margin:6px 0 0;color:#f8d7d7;font-size:13px;">Blood Donation Network</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:18px;">
            Email notifications are active
          </h2>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Hi <strong>${toName}</strong>, your SaveLife notifications are working.
          </p>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0;">
            Whenever a donor accepts your blood or plasma request, you will receive
            an email at <strong>${toEmail}</strong> with their name and phone number
            so you can contact them immediately.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e0e0e0;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">
            SaveLife Blood Donation Network
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
    text: `Hi ${toName},\nYour SaveLife email notifications are active.\nYou will be notified at ${toEmail} when a donor accepts your request.\n\n— SaveLife`,
  });
}

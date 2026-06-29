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

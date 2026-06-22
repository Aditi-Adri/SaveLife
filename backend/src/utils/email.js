// Email notifications via Gmail SMTP + nodemailer.
// Sends to ANY recipient email address — no domain required.
// Set EMAIL_USER + EMAIL_PASS (Gmail App Password) in backend/.env.

import nodemailer from "nodemailer";

let _transporter = null;

function transport() {
  if (_transporter) return _transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
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

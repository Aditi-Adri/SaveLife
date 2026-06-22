// Push notifications via ntfy.sh — free, no API key, no signup.
// Each user gets a deterministic topic derived from their Donor ID.
// Recipient installs the free ntfy app and subscribes to their topic.

const NTFY_BASE = "https://ntfy.sh";

export function ntfyTopic(userCode) {
  return `savelife-${userCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
}

export async function pushNotify(userCode, title, body) {
  if (!userCode) return;
  const topic = ntfyTopic(userCode);
  try {
    await fetch(`${NTFY_BASE}/${topic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Title": title,
        "Tags": "drop_of_blood,savelife",
        "Priority": "high",
      },
      body,
    });
  } catch (err) {
    console.warn("[ntfy] push failed:", err.message);
  }
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAILJET_API_KEY = Deno.env.get("MAILJET_API_KEY") ?? "";
const MAILJET_SECRET  = Deno.env.get("MAILJET_SECRET_KEY") ?? "";
const FROM_EMAIL      = "info@precision-training.io";
const FROM_NAME       = "Precision Training";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    const { emails, subject, message } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return json({ error: "No emails provided" }, 400);
    }
    if (!subject?.trim() || !message?.trim()) {
      return json({ error: "Subject and message are required" }, 400);
    }

    const unique = [...new Set(emails.filter((e: string) => e && e.includes("@")))];
    if (unique.length === 0) {
      return json({ error: "No valid email addresses" }, 400);
    }

    // Send individually so each gets a personal email (no group header leaking)
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of unique) {
      const body = {
        Messages: [
          {
            From: { Email: FROM_EMAIL, Name: FROM_NAME },
            To: [{ Email: email }],
            Subject: subject,
            TextPart: message,
          },
        ],
      };

      const res = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET}`),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        sent++;
      } else {
        failed++;
        const errData = await res.json().catch(() => ({}));
        errors.push(`${email}: ${JSON.stringify(errData)}`);
      }
    }

    return json({ sent, failed, total: unique.length, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

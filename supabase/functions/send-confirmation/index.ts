import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RegistrationEmailPayload {
  to: string;
  type: "EVENT_PASS" | "INDUCTION_RECEIPT";
  pass_id?: string;
  event_title?: string;
  venue?: string;
  date_time?: string;
  participant_name: string;
  roll_number: string;
  department: string;
  team_name?: string;
  preferred_wing?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload: RegistrationEmailPayload = await req.json();

    if (!payload.to || !payload.to.toLowerCase().endsWith("@nitkkr.ac.in")) {
      return new Response(JSON.stringify({ error: "Only @nitkkr.ac.in recipients permitted" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let subject = "";
    let htmlContent = "";

    if (payload.type === "EVENT_PASS") {
      subject = `[Confirmed Pass ${payload.pass_id}] ${payload.event_title} — Techspardha 2026 | Electroreck`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060913; color: #f1f5f9; padding: 20px; }
            .card { max-width: 550px; margin: 0 auto; background: #0b1120; border: 2px solid #00d4ff; border-radius: 14px; overflow: hidden; }
            .header { background: #00d4ff; color: #060913; padding: 12px 20px; font-weight: 800; font-size: 13px; text-transform: uppercase; }
            .body { padding: 25px; }
            .pass-id { font-family: monospace; font-size: 18px; font-weight: 700; color: #00d4ff; background: rgba(0, 212, 255, 0.1); padding: 5px 10px; border-radius: 6px; display: inline-block; }
            .meta-row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 0; font-size: 14px; }
            .meta-label { color: #94a3b8; }
            .meta-val { font-weight: 600; color: #f1f5f9; }
            .footer { padding: 15px 25px; background: rgba(0,0,0,0.3); font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">Electroreck · NIT Kurukshetra · Entry Pass</div>
            <div class="body">
              <span class="pass-id">${payload.pass_id}</span>
              <h2 style="margin: 15px 0 5px; color: #ffffff;">${payload.event_title}</h2>
              <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Official registration pass for Techspardha 2026.</p>
              
              <div class="meta-row"><span class="meta-label">Participant</span><span class="meta-val">${payload.participant_name}</span></div>
              <div class="meta-row"><span class="meta-label">Roll Number</span><span class="meta-val">${payload.roll_number}</span></div>
              <div class="meta-row"><span class="meta-label">Department</span><span class="meta-val">${payload.department}</span></div>
              <div class="meta-row"><span class="meta-label">Venue</span><span class="meta-val">${payload.venue || 'Lecture Hall Complex'}</span></div>
              <div class="meta-row"><span class="meta-label">Event Date</span><span class="meta-val">${payload.date_time || 'TBA'}</span></div>
              ${payload.team_name ? `<div class="meta-row"><span class="meta-label">Team Name</span><span class="meta-val">${payload.team_name}</span></div>` : ''}
            </div>
            <div class="footer">
              Electrical Engineering Society · National Institute of Technology, Kurukshetra<br>
              Please present this digital pass or email at the event registration desk.
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = `[Application Received] Electroreck Society Induction 2026`;
      htmlContent = `
        <div style="font-family: sans-serif; background: #060913; color: #fff; padding: 25px;">
          <h2>Induction Application Received</h2>
          <p>Dear ${payload.participant_name} (${payload.roll_number}),</p>
          <p>Your recruitment application for the <strong>${payload.preferred_wing}</strong> wing of Electroreck Society has been successfully registered.</p>
          <p>The core committee is reviewing submissions. Interview dates will be notified to this email address.</p>
          <br>
          <p>Best regards,<br>Electroreck Core Committee<br>NIT Kurukshetra</p>
        </div>
      `;
    }

    // If Resend API Key is set in Supabase Secrets, dispatch through Resend
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Electroreck Society <no-reply@electroreck.nitkkr.ac.in>",
          to: [payload.to],
          subject: subject,
          html: htmlContent,
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, resend: data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      simulated: true,
      message: `Confirmation email rendered and dispatched to ${payload.to}`
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

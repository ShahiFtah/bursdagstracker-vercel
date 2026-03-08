// api/send-birthday-emails.js
// Vercel serverless funksjon som kjører automatisk hver dag kl. 08:00
// Henter alle personer fra Supabase, sjekker bursdager, sender e-post via Resend

const SUPABASE_URL = "https://dkmdgrfvzdgnzylhqcko.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWRncmZ2emRnbnp5bGhxY2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njg3ODIsImV4cCI6MjA4ODU0NDc4Mn0.YktstZkUdegC9Xtj4VHylZFjHavoGQXVSrgsmU43Od0";
const RESEND_API_KEY = "re_JSjYKBd5_NLhRsiuGP8fmSDL5EHDj3rNW";
const FROM_EMAIL = "Bursdagstracker <noreply@shahiftah.me>";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Hent alle personer fra Supabase
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/people?select=*`, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
    });
    const people = await dbRes.json();

    // 2. Finn hvem som har bursdag i dag
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const birthdayPeople = people.filter((person) => {
      const bday = new Date(person.birthday);
      return bday.getMonth() + 1 === todayMonth && bday.getDate() === todayDay;
    });

    if (birthdayPeople.length === 0) {
      return res.status(200).json({ message: "Ingen bursdager i dag", sent: 0 });
    }

    // 3. Send e-post til hver bursdagsperson
    const results = [];
    for (const person of birthdayPeople) {
      const age = today.getFullYear() - new Date(person.birthday).getFullYear();

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [person.email],
          subject: `🎂 Gratulerer med dagen, ${person.name}!`,
          html: `
            <!DOCTYPE html>
            <html lang="no">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#F4F5F7;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:40px 20px;">
                <tr><td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background:#1D4ED8;padding:36px 40px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:12px;">🎂</div>
                        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">
                          Gratulerer med dagen!
                        </h1>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:36px 40px;">
                        <p style="margin:0 0 16px;font-size:16px;color:#1F2933;line-height:1.6;">
                          Hei <strong>${person.name}</strong>! 👋
                        </p>
                        <p style="margin:0 0 16px;font-size:15px;color:#52606D;line-height:1.7;">
                          I dag fyller du <strong style="color:#1D4ED8;">${age} år</strong> — og det er en god grunn til å feire!
                          Vi håper du får en fantastisk dag fylt med glede og gode minner.
                        </p>
                        <p style="margin:0 0 32px;font-size:15px;color:#52606D;line-height:1.7;">
                          Nyt dagen din til det fulle. 🎉
                        </p>

                        <!-- Birthday card -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px 24px;text-align:center;">
                              <div style="font-size:32px;margin-bottom:8px;">🥳</div>
                              <div style="font-size:22px;font-weight:700;color:#1D4ED8;margin-bottom:4px;">${age} år</div>
                              <div style="font-size:13px;color:#9AA5B4;text-transform:uppercase;letter-spacing:0.7px;">Gratulerer!</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#F4F5F7;padding:20px 40px;text-align:center;border-top:1px solid #E4E7EB;">
                        <p style="margin:0;font-size:12px;color:#9AA5B4;line-height:1.6;">
                          Denne e-posten ble sendt automatisk av Bursdagstracker.<br>
                          ${person.department ? `Avdeling: ${person.department}` : ""}
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `,
        }),
      });

      const emailData = await emailRes.json();
      results.push({
        name: person.name,
        email: person.email,
        status: emailRes.ok ? "sendt" : "feil",
        data: emailData,
      });
    }

    return res.status(200).json({
      message: `Sendte ${results.filter(r => r.status === "sendt").length} e-post(er)`,
      results,
    });

  } catch (error) {
    console.error("Feil:", error);
    return res.status(500).json({ error: error.message });
  }
}

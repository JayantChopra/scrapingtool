import { Resend } from "resend";

interface SendLeadsEmailOptions {
  resendApiKey: string;
  recipientEmail: string;
  csvString: string;
  listName: string;
  leadCount: number;
}

export async function sendLeadsEmail(options: SendLeadsEmailOptions) {
  const { resendApiKey, recipientEmail, csvString, listName, leadCount } = options;

  const resend = new Resend(resendApiKey);

  const csvBuffer = Buffer.from(csvString, "utf-8");
  const filename = listName.replace(/[^a-zA-Z0-9\-_ ]/g, "").replace(/\s+/g, "_") + ".csv";

  const { error } = await resend.emails.send({
    from: "Doug's Scraper <onboarding@resend.dev>",
    to: recipientEmail,
    subject: `${leadCount} New Leads Generated — ${listName}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #4f46e5;">New Leads Generated</h2>
        <p><strong>${leadCount}</strong> leads have been generated and saved.</p>
        <p>List: <strong>${listName}</strong></p>
        <p>The CSV file is attached below.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Sent by Doug's Personal Scraper</p>
      </div>
    `,
    attachments: [
      {
        filename,
        content: csvBuffer,
        contentType: "text/csv",
      },
    ],
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

import { z } from "zod";
import { generateCSVString } from "@/lib/csv";
import { sendLeadsEmail } from "@/lib/email";

const requestSchema = z.object({
  leads: z.array(
    z.object({
      name: z.string(),
      company: z.string(),
      city: z.string(),
      signalType: z.string(),
      sourceLink: z.string(),
      explanation: z.string(),
      linkedinUrl: z.string().optional().default(""),
    })
  ),
  listName: z.string(),
  resendApiKey: z.string().optional(),
  recipientEmail: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads, listName, resendApiKey, recipientEmail } = requestSchema.parse(body);

    const apiKey = resendApiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "No Resend API key configured. Add one in Settings or set RESEND_API_KEY env var." },
        { status: 400 }
      );
    }

    if (leads.length === 0) {
      return Response.json({ error: "No leads to email." }, { status: 400 });
    }

    const csvString = generateCSVString(leads);
    await sendLeadsEmail({
      resendApiKey: apiKey,
      recipientEmail,
      csvString,
      listName,
      leadCount: leads.length,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Email API error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return Response.json({ error: message }, { status: 500 });
  }
}

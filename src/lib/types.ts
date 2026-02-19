import { z } from "zod";

// --- Zod schemas (used by API route for LLM structured output) ---

export const leadSchema = z.object({
  name: z.string().describe("Full name of the founder or executive"),
  company: z.string().describe("Company name"),
  city: z.string().describe("City in Canada where the person or company is based"),
  signalType: z
    .string()
    .describe("Type of signal: e.g. Liquidity Event, Rapid Scaling, Major Donation, Exit, IPO"),
  sourceLink: z.string().describe("URL of the original source article"),
  explanation: z
    .string()
    .describe("1-2 sentence explanation of why this person is a strong lead"),
  linkedinUrl: z
    .string()
    .describe("LinkedIn profile URL for this person, or empty string if not found"),
});

export const leadsResponseSchema = z.object({
  leads: z.array(leadSchema),
});

// --- TypeScript interfaces (used by frontend components) ---

export interface Lead {
  id?: string;
  list_id?: string;
  name: string;
  company: string;
  city: string;
  signalType: string;
  sourceLink: string;
  explanation: string;
  linkedinUrl: string;
  created_at?: string;
}

export interface LeadList {
  id: string;
  name: string;
  created_at: string;
  lead_count?: number;
}

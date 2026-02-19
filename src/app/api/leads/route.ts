import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { fetchLiquiditySignals } from "@/lib/exa";
import { getSupabaseClient } from "@/lib/supabase";
import { leadsResponseSchema } from "@/lib/types";

const requestSchema = z.object({
  exaApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  referenceUrls: z.array(z.string()).optional(),
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  maxResults: z.number().min(5).max(25).optional(),
});

const MAX_SEARCH_TIME_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 5;

const SYSTEM_PROMPT = `You are a wealth intelligence analyst. You will receive a set of articles, each clearly marked with [ARTICLE N], a URL, a TITLE, and CONTENT.

Your job: extract people from these articles who are private business founders or executives in Ontario or British Columbia, Canada showing signals of emerging wealth.

SOURCE LINK RULES (MOST IMPORTANT):
- The sourceLink for each lead MUST be copied EXACTLY from the "URL:" line of the article where you found that person.
- NEVER make up, guess, or modify a URL. Only use URLs that appear verbatim after "URL:" in the provided data.
- Each lead must come from a DIFFERENT article URL.
- If an article URL is "https://example.com/some-article" then sourceLink must be exactly "https://example.com/some-article".

OTHER RULES:
1. Each lead MUST be based in Ontario or British Columbia — cities like Toronto, Vancouver, Ottawa, Mississauga, Hamilton, Kitchener, Waterloo, London, Brampton, Markham, Vaughan, Oakville, Burlington, Guelph, Kingston, Victoria, Surrey, Burnaby, Richmond, Kelowna, etc.
2. Spread leads across DIFFERENT cities. Geographic diversity.
3. Each lead MUST be a UNIQUE person — no duplicates.
4. Diversify signal types: "Liquidity Event", "Rapid Scaling", "Major Donation", "Exit", "IPO/SPAC". Use at least 3 different types.
5. Target emerging wealth ($30M–$200M net worth). Exclude billionaires.
6. Explanation must be exactly ONE concise sentence.
7. For linkedinUrl, return an empty string.`;

interface VerifiedLead {
  name: string;
  company: string;
  city: string;
  signalType: string;
  sourceLink: string;
  explanation: string;
  linkedinUrl: string;
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data as Record<string, unknown> })}\n\n`)
        );
      }

      try {
        const body = await req.json().catch(() => ({}));
        const { exaApiKey, geminiApiKey, referenceUrls, supabaseUrl, supabaseAnonKey, maxResults } =
          requestSchema.parse(body);

        const resultLimit = maxResults ?? 10;
        const startTime = Date.now();

        // Step 1: Exa search
        sendEvent("progress", { step: 1, total: 4, message: "Searching Exa for liquidity signals..." });

        const { text: signalsText, validUrls } = await fetchLiquiditySignals({ exaApiKey, referenceUrls });

        // Step 2: LLM extraction with retry loop
        const googleApiKey = geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!googleApiKey) {
          sendEvent("error", { message: "No Gemini API key provided. Add one in Settings or set GOOGLE_GENERATIVE_AI_API_KEY env var." });
          controller.close();
          return;
        }

        const google = createGoogleGenerativeAI({ apiKey: googleApiKey });

        const allVerified: VerifiedLead[] = [];
        const usedSources = new Set<string>();
        const usedNames = new Set<string>();
        let attempt = 0;
        let hitTimeout = false;

        while (allVerified.length < resultLimit && attempt < MAX_RETRIES) {
          // Check timeout
          if (Date.now() - startTime > MAX_SEARCH_TIME_MS) {
            hitTimeout = true;
            break;
          }

          attempt++;
          const still_need = resultLimit - allVerified.length;

          if (attempt === 1) {
            sendEvent("progress", { step: 2, total: 4, message: "Analyzing results with Gemini AI..." });
          } else {
            sendEvent("progress", { step: 2, total: 4, message: `Found ${allVerified.length}/${resultLimit} verified leads. Searching for ${still_need} more (attempt ${attempt})...` });
          }

          // Build exclusion list for retry prompts
          const excludeNames = allVerified.map(l => l.name);
          const excludeSources = allVerified.map(l => l.sourceLink);

          let retryContext = "";
          if (excludeNames.length > 0) {
            retryContext = `\n\nIMPORTANT: Do NOT include these people (already found): ${excludeNames.join(", ")}.\nDo NOT use these source URLs (already used): ${excludeSources.join(", ")}.\nFind ${still_need} NEW and DIFFERENT people from DIFFERENT articles.`;
          }

          try {
            const { object } = await generateObject({
              model: google("gemini-3-flash-preview"),
              schema: leadsResponseSchema,
              system: SYSTEM_PROMPT,
              prompt: signalsText + retryContext + `\n\nReturn exactly ${still_need} candidates.`,
            });

            // Verify each lead
            for (const lead of object.leads) {
              if (allVerified.length >= resultLimit) break;

              const srcKey = lead.sourceLink.toLowerCase();
              const nameKey = lead.name.toLowerCase();

              if (usedSources.has(srcKey) || usedNames.has(nameKey)) continue;
              if (!lead.name || !lead.company || !lead.city || !lead.sourceLink) continue;

              const isRealSource = validUrls.has(lead.sourceLink);
              if (!isRealSource) {
                console.warn(`Attempt ${attempt}: Dropping "${lead.name}" — fabricated source: ${lead.sourceLink}`);
                continue;
              }

              usedSources.add(srcKey);
              usedNames.add(nameKey);
              allVerified.push(lead);
            }
          } catch (llmError) {
            console.error(`Attempt ${attempt} LLM error:`, llmError);
            // If rate limited or error, wait a bit and retry
            if (attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, 3000));
            }
          }
        }

        // Determine completion message
        let completionNote = "";
        if (allVerified.length < resultLimit) {
          completionNote = hitTimeout ? " (timed out)" : " (max attempts reached)";
        }

        sendEvent("progress", { step: 3, total: 4, message: `Verified ${allVerified.length}/${resultLimit} leads${completionNote}. Saving to database...` });

        // Step 3: Persist to Supabase
        let listId: string | null = null;
        let insertedCount = 0;
        let skippedCount = 0;

        try {
          const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

          const listName = `Generate Run - ${new Date().toLocaleString()}`;
          const { data: listData, error: listError } = await supabase
            .from("lists")
            .insert({ name: listName })
            .select("id")
            .single();

          if (listError) throw listError;
          listId = listData.id;

          for (const lead of allVerified) {
            const { data: existing } = await supabase
              .from("leads")
              .select("id")
              .ilike("name", lead.name)
              .ilike("company", lead.company)
              .limit(1);

            if (existing && existing.length > 0) {
              const existingId = existing[0].id;
              await supabase.from("list_leads").insert({
                list_id: listId,
                lead_id: existingId,
              }).select();
              skippedCount++;
              continue;
            }

            const { data: insertedLead, error: insertError } = await supabase.from("leads").insert({
              name: lead.name,
              company: lead.company,
              city: lead.city,
              signal_type: lead.signalType,
              source_link: lead.sourceLink,
              explanation: lead.explanation,
              linkedin_url: lead.linkedinUrl || "",
            }).select("id").single();

            if (insertError) {
              if (insertError.code === "23505") {
                skippedCount++;
              } else {
                console.error("Insert error for lead:", lead.name, insertError);
              }
            } else {
              insertedCount++;
              if (insertedLead) {
                await supabase.from("list_leads").insert({
                  list_id: listId,
                  lead_id: insertedLead.id,
                }).select();
              }
            }
          }
        } catch (dbError) {
          console.error("Supabase persistence error:", dbError);
        }

        sendEvent("progress", { step: 4, total: 4, message: "Done!" });

        sendEvent("result", {
          leads: allVerified,
          listId,
          stats: { total: allVerified.length, inserted: insertedCount, skipped: skippedCount },
          partial: allVerified.length < resultLimit,
          message: allVerified.length < resultLimit
            ? `Most relevant leads generated (${allVerified.length}/${resultLimit} found with verified sources)`
            : undefined,
        });
      } catch (error) {
        console.error("Lead generation error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate leads";
        sendEvent("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

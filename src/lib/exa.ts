import Exa from "exa-js";

const DEFAULT_BENCHMARK_URLS = [
  // Kitchener-Waterloo tech exit
  "https://betakit.com/rockwell-automation-completes-acquisition-of-clearpath-robotics-and-its-otto-motors-division/",
  // Toronto philanthropy
  "https://www.thestar.com/news/gta/transformative-toronto-philanthropist-makes-35-million-donation-to-sickkids-cheo-for-mental-health-care/article_1be8fa68-cdac-471c-aa96-ad70e702a9d4.html",
  // Vancouver tech acquisition
  "https://betakit.com/hootsuite-sold-to-us-based-infor-after-years-of-acquisition-speculation/",
  // Ottawa tech scaling
  "https://betakit.com/shopify-reaches-agreement-to-acquire-checkout-startup-bench/",
  // Ontario startup funding
  "https://betakit.com/wealthsimple-raises-100-million-round-as-canadian-fintech-continues-growth/",
];

interface FetchOptions {
  exaApiKey?: string;
  referenceUrls?: string[];
}

interface FetchResult {
  text: string;
  validUrls: Set<string>;
}

export async function fetchLiquiditySignals(options?: FetchOptions): Promise<FetchResult> {
  const apiKey = options?.exaApiKey || process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("No Exa API key provided. Add one in Settings or set EXA_API_KEY env var.");
  }

  const exa = new Exa(apiKey);

  const urls = [
    ...DEFAULT_BENCHMARK_URLS,
    ...(options?.referenceUrls ?? []),
  ];

  const results = await Promise.all(
    urls.map((url) =>
      exa.findSimilarAndContents(url, {
        numResults: 5,
        text: true,
      })
    )
  );

  const validUrls = new Set<string>();

  const combinedText = results
    .flatMap((r, batchIndex) =>
      r.results.map((item, itemIndex) => {
        const text = item.text ?? "";
        const url = item.url;
        validUrls.add(url);
        return `[ARTICLE ${batchIndex * 5 + itemIndex + 1}]\nURL: ${url}\nTITLE: ${item.title}\nCONTENT:\n${text.slice(0, 1500)}\n[END ARTICLE]`;
      })
    )
    .join("\n\n");

  return { text: combinedText, validUrls };
}

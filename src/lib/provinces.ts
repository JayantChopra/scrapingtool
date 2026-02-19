export const PROVINCE_NAMES: Record<string, string> = {
  BC: "British Columbia",
  AB: "Alberta",
  SK: "Saskatchewan",
  MB: "Manitoba",
  ON: "Ontario",
  QC: "Quebec",
  NB: "New Brunswick",
  NS: "Nova Scotia",
  PE: "Prince Edward Island",
  NL: "Newfoundland & Labrador",
  YT: "Yukon",
  NT: "Northwest Territories",
  NU: "Nunavut",
};

const CITY_TO_PROVINCE: Record<string, string> = {
  // British Columbia
  vancouver: "BC", victoria: "BC", burnaby: "BC", surrey: "BC", kelowna: "BC",
  richmond: "BC", nanaimo: "BC", kamloops: "BC", abbotsford: "BC",
  // Alberta
  calgary: "AB", edmonton: "AB", "red deer": "AB", lethbridge: "AB",
  "medicine hat": "AB", "fort mcmurray": "AB", banff: "AB",
  // Saskatchewan
  saskatoon: "SK", regina: "SK", "prince albert": "SK",
  // Manitoba
  winnipeg: "MB", brandon: "MB", steinbach: "MB",
  // Ontario
  toronto: "ON", ottawa: "ON", mississauga: "ON", brampton: "ON",
  hamilton: "ON", london: "ON", kitchener: "ON", windsor: "ON",
  waterloo: "ON", guelph: "ON", barrie: "ON", kingston: "ON",
  oshawa: "ON", markham: "ON", vaughan: "ON", "richmond hill": "ON",
  oakville: "ON", burlington: "ON", "thunder bay": "ON",
  "st. catharines": "ON", cambridge: "ON",
  // Quebec
  montreal: "QC", "quebec city": "QC", quebec: "QC", laval: "QC",
  gatineau: "QC", sherbrooke: "QC", "trois-rivières": "QC",
  "trois-rivieres": "QC", longueuil: "QC",
  // New Brunswick
  "saint john": "NB", moncton: "NB", fredericton: "NB",
  // Nova Scotia
  halifax: "NS", "cape breton": "NS", dartmouth: "NS", sydney: "NS",
  // Prince Edward Island
  charlottetown: "PE", summerside: "PE",
  // Newfoundland & Labrador
  "st. john's": "NL", "st john's": "NL", "corner brook": "NL",
  // Territories
  whitehorse: "YT", yellowknife: "NT", iqaluit: "NU",
};

export function cityToProvince(city: string): string | null {
  const normalized = city.toLowerCase().trim();
  return CITY_TO_PROVINCE[normalized] ?? null;
}

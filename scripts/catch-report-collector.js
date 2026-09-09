const fs = require("fs");
const path = require("path");

const SOURCE_URLS = [
  {
    name: "Fishing in Wales",
    url: "https://fishingwales.net/sea-fishing-catch-reports/"
  }
];

const OUTPUT = path.join(
  process.cwd(),
  "data",
  "external-catch-reports.json"
);

/*
  These are deliberately conservative.
  A report is only assigned to a mark when the source text
  contains a reasonably strong location match.
*/

const MARK_ALIASES = {
  "Monknash": ["monknash"],
  "Nash Point": ["nash point"],
  "St Donats": ["st donats", "st. donats"],
  "Llantwit Major": ["llantwit major"],
  "Aberthaw": ["aberthaw"],
  "Dunraven Bay": ["dunraven", "dunraven bay"],
  "Southerndown": ["southerndown"],
  "Ogmore": ["ogmore"],
  "Sker Point": ["sker point", "sker"],
  "Sker Rocks": ["sker rocks"],
  "Rest Bay": ["rest bay"],
  "Newton Point": ["newton point"],
  "Porthcawl Harbour": ["porthcawl harbour"],
  "Aberavon": ["aberavon"],
  "Neath River Mouth": ["neath river", "neath mouth"],
  "Swansea West Pier": ["swansea west pier"],
  "Mumbles": ["mumbles"],
  "Bracelet Bay": ["bracelet bay"],
  "Langland Bay": ["langland"],
  "Caswell Bay": ["caswell"],
  "Brandy Cove": ["brandy cove"],
  "Pobbles Bay": ["pobbles"],
  "Three Cliffs Bay": ["three cliffs"],
  "Oxwich Bay": ["oxwich"],
  "Port Eynon": ["port eynon"],
  "Mewslade Bay": ["mewslade"],
  "Llangennith": ["llangennith"],
  "Rhossili": ["rhossili", "worms head", "worm's head"],
  "Broughton Bay": ["broughton bay"],
  "Whiteford Sands": ["whiteford"],
  "Cefn Sidan": ["cefn sidan"],
  "Burry Port North Channel": ["burry port north channel"],
  "Burry Port": ["burry port"],
  "Pendine": ["pendine"],
  "Freshwater East": ["freshwater east"],
  "Manorbier Bay": ["manorbier bay"],
  "Manorbier Castle Beach": ["manorbier"],
  "Saundersfoot Beach": ["saundersfoot"],
  "Saundersfoot Harbour": ["saundersfoot harbour"],
  "Broad Haven South": ["broad haven south"],
  "Druidston Haven": ["druidston"],
  "Angle Bay": ["angle bay"],
  "Pembroke River": ["pembroke river"],
  "Freshwater West": ["freshwater west"]
};

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function findMark(text) {
  const lower = text.toLowerCase();

  for (const [mark, aliases] of Object.entries(MARK_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        return mark;
      }
    }
  }

  return null;
}

function extractBassMentions(text) {
  const lower = text.toLowerCase();

  return (
    lower.includes("bass") ||
    lower.includes("sea bass") ||
    lower.includes("lure caught bass") ||
    lower.includes("bass fishing")
  );
}

function extractFishCount(text) {
  const patterns = [
    /(\d+)\s+bass\b/i,
    /(\d+)\s+sea bass\b/i,
    /(\d+)\s+bass caught\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
}

function extractWeight(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*lb\b/i,
    /(\d+(?:\.\d+)?)\s*lbs\b/i,
    /(\d+(?:\.\d+)?)\s*pounds?\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
}

function extractMethod(text) {
  const methods = [
    "lure",
    "lures",
    "spinning",
    "spinner",
    "plug",
    "soft plastic",
    "jig",
    "bait",
    "fly"
  ];

  const lower = text.toLowerCase();

  return methods.find(method => lower.includes(method)) || null;
}

function extractDate(text) {
  const patterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function makeId(source, mark, text) {
  const raw = `${source}|${mark || "unknown"}|${text}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  let hash = 0;

  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `external-${Math.abs(hash)}`;
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent":
        "Bass-Finder-Wales/1.0 catch-report research collector"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${source.name}: HTTP ${response.status}`
    );
  }

  return response.text();
}

function buildReport(source, html) {
  const text = cleanText(html);

  if (!extractBassMentions(text)) {
    return [];
  }

  const mark = findMark(text);

  /*
    We deliberately do not create a mark-specific report
    when we cannot identify the mark.
  */

  if (!mark) {
    return [];
  }

  const report = {
    id: makeId(source.name, mark, text.slice(0, 1000)),
    source: source.name,
    sourceUrl: source.url,
    markName: mark,
    date: extractDate(text),
    time: null,
    species: "Bass",
    fishCount: extractFishCount(text),
    fishWeightLb: extractWeight(text),
    method: extractMethod(text),
    lure: null,
    notes: text.slice(0, 1500),
    conditions: null,
    collectedAt: new Date().toISOString(),
    confidence: "medium"
  };

  return [report];
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT), {
    recursive: true
  });

  const reports = [];

  for (const source of SOURCE_URLS) {
    try {
      console.log(`Checking ${source.name}...`);

      const html = await fetchSource(source);
      const sourceReports = buildReport(source, html);

      reports.push(...sourceReports);

      console.log(
        `${source.name}: ${sourceReports.length} usable bass reports`
      );
    } catch (error) {
      console.error(
        `${source.name} failed:`,
        error.message
      );
    }
  }

  const unique = Array.from(
    new Map(
      reports.map(report => [report.id, report])
    ).values()
  );

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    reportCount: unique.length,
    reports: unique
  };

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(output, null, 2)
  );

  console.log(
    `Saved ${unique.length} external reports to ${OUTPUT}`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

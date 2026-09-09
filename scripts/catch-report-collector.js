const fs = require("fs");
const path = require("path");

const SOURCE_URLS = [
  {
    url: "https://fishingwales.net/sea-fishing-catch-reports/",
    source: "Fishing in Wales"
  }
];

const OUTPUT = path.join(
  process.cwd(),
  "data",
  "external-catch-reports.json"
);

const USER_AGENT =
  "Bass Finder Wales/3.0 (+https://github.com/6kyrfm8p7r-eng/Bass-finder-wales-v2)";

const MARK_ALIASES = {
  "Monknash": ["monknash", "monknash coast", "monknash beach"],
  "Nash Point": ["nash point"],
  "St Donats": ["st donats", "st. donats"],
  "Llantwit Major": ["llantwit major"],
  "Aberthaw": ["aberthaw", "aberthaw beach"],
  "Dunraven Bay": ["dunraven bay", "dunraven"],
  "Southerndown": ["southerndown"],
  "Ogmore": ["ogmore", "ogmore by sea", "ogmore beach"],
  "Sker Point": ["sker point"],
  "Sker Rocks": ["sker rocks", "sker rock"],
  "Rest Bay": ["rest bay"],
  "Newton Point": ["newton point"],
  "Porthcawl Harbour": ["porthcawl harbour"],
  "Aberavon": ["aberavon", "aberavon beach"],
  "Neath River Mouth": ["neath river mouth", "neath mouth"],
  "Swansea West Pier": [
    "swansea west pier",
    "west pier",
    "swansea pier"
  ],
  "Mumbles": ["mumbles", "mumbles pier"],
  "Bracelet Bay": ["bracelet bay"],
  "Langland Bay": ["langland bay", "langland"],
  "Caswell Bay": ["caswell bay", "caswell"],
  "Brandy Cove": ["brandy cove"],
  "Pobbles Bay": ["pobbles bay", "pobbles"],
  "Three Cliffs Bay": ["three cliffs bay", "three cliffs"],
  "Oxwich Bay": ["oxwich bay", "oxwich"],
  "Port Eynon": ["port eynon", "porteynon"],
  "Mewslade Bay": ["mewslade bay", "mewslade"],
  "Llangennith": ["llangennith", "llangennith beach"],
  "Rhossili": ["rhossili", "rhossili bay"],
  "Broughton Bay": ["broughton bay"],
  "Whiteford Sands": ["whiteford sands", "whiteford"],
  "Cefn Sidan": ["cefn sidan"],
  "Burry Port North Channel": [
    "burry port north channel",
    "north channel",
    "burry port channel"
  ],
  "Burry Port": ["burry port"],
  "Pendine": ["pendine", "pendine sands"],
  "Freshwater East": ["freshwater east"],
  "Manorbier Bay": ["manorbier bay", "manorbier"],
  "Manorbier Castle Beach": [
    "manorbier castle beach",
    "castle beach"
  ],
  "Saundersfoot Beach": [
    "saundersfoot beach",
    "saundersfoot"
  ],
  "Saundersfoot Harbour": ["saundersfoot harbour"],
  "Broad Haven South": ["broad haven south"],
  "Druidston Haven": ["druidston haven", "druidston"],
  "Angle Bay": ["angle bay", "angle"],
  "Pembroke River": ["pembroke river", "pembroke"],
  "Freshwater West": ["freshwater west"]
};


/* ---------------------------------------------------------
   BASIC HELPERS
--------------------------------------------------------- */

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalise(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function containsBass(text) {
  return /\bbass(?:es)?\b/i.test(text);
}

function containsCatchLanguage(text) {
  return /\b(caught|catch|catches|catching|landed|landing|hooked|hook-up|hookup|take|takes|took|hit|hits|bite|bites|fishing|produced|producing|accounted for|fish were caught|bass were caught|bass was caught)\b/i.test(
    text
  );
}

function containsStrongCatchLanguage(text) {
  return /\b(caught|landed|bass (?:was|were) caught|bass (?:was|were) landed|caught a bass|caught bass|landed a bass|landed bass|bass to \d|bass of \d|produced \d+ bass|produced a bass|produced bass)\b/i.test(
    text
  );
}


/* ---------------------------------------------------------
   HTML EXTRACTION
--------------------------------------------------------- */

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&rsquo;/gi, "’")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function extractParagraphs(html) {
  const matches =
    String(html || "").match(
      /<(p|li|h2|h3|h4|h5)[^>]*>[\s\S]*?<\/\1>/gi
    ) || [];

  return matches
    .map(block => stripHtml(block))
    .map(cleanText)
    .filter(text => text.length >= 20);
}

function splitSentences(text) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(cleanText)
    .filter(Boolean);
}


/* ---------------------------------------------------------
   MARK MATCHING
--------------------------------------------------------- */

function findMarks(text) {
  const found = [];

  for (const [markName, aliases] of Object.entries(MARK_ALIASES)) {
    for (const alias of aliases) {
      const regex = new RegExp(
        `\\b${escapeRegex(alias)}\\b`,
        "i"
      );

      if (regex.test(text)) {
        found.push({
          markName,
          matchedAlias: alias
        });

        break;
      }
    }
  }

  return found;
}


/* ---------------------------------------------------------
   LOCAL EVIDENCE
--------------------------------------------------------- */

function getLocalEvidence(paragraph, markName) {
  const aliases = MARK_ALIASES[markName] || [markName];

  const sentences = splitSentences(paragraph);

  return sentences.filter(sentence =>
    aliases.some(alias =>
      new RegExp(
        `\\b${escapeRegex(alias)}\\b`,
        "i"
      ).test(sentence)
    )
  );
}

function getEvidenceType(text, markCount) {
  if (!containsBass(text)) {
    return "uncertain";
  }

  if (
    markCount === 1 &&
    containsStrongCatchLanguage(text)
  ) {
    return "confirmed_catch";
  }

  if (
    markCount === 1 &&
    containsCatchLanguage(text)
  ) {
    return "activity_mention";
  }

  if (
    markCount > 1 &&
    containsStrongCatchLanguage(text)
  ) {
    return "activity_mention";
  }

  if (markCount > 0) {
    return "activity_mention";
  }

  return "regional_report";
}

function scoringEligible(evidenceType) {
  return evidenceType === "confirmed_catch";
}


/* ---------------------------------------------------------
   CATCH DETAILS
--------------------------------------------------------- */

function extractFishCount(text) {
  if (!containsBass(text)) {
    return null;
  }

  const patterns = [
    /\b(\d+)\s+(?:bass|sea bass)\b/i,
    /\b(?:caught|landed|produced)\s+(\d+)\s+(?:bass|sea bass)\b/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);

    if (!match) continue;

    const value = Number(match[1]);

    if (
      Number.isFinite(value) &&
      value > 0 &&
      value < 100
    ) {
      return value;
    }
  }

  return null;
}

function extractWeight(text) {
  if (!containsBass(text)) {
    return null;
  }

  const patterns = [
    /\b(?:bass|fish)\s+(?:of|to|around|at)\s+(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\s+(?:bass|fish)\b/i,
    /\b(?:bass|fish)\s+weighing\s+(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\b/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);

    if (!match) continue;

    const value = Number(match[1]);

    if (
      Number.isFinite(value) &&
      value > 0 &&
      value < 100
    ) {
      return value;
    }
  }

  return null;
}

function extractLength(text) {
  if (!containsBass(text)) {
    return null;
  }

  const patterns = [
    /\b(?:bass|fish)\s+(?:of|to|around)\s+(\d+(?:\.\d+)?)\s*(?:cm|mm|inches?|in)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:cm|mm|inches?|in)\s+(?:bass|fish)\b/i,
    /\b(?:bass|fish)\s+measuring\s+(\d+(?:\.\d+)?)\s*(?:cm|mm|inches?|in)\b/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);

    if (!match) continue;

    const value = Number(match[1]);

    if (
      Number.isFinite(value) &&
      value > 10 &&
      value < 150
    ) {
      return value;
    }
  }

  return null;
}


/*
  Lure extraction is intentionally disabled for now.

  The previous collector was incorrectly interpreting ordinary
  article phrases as lure names. We will add controlled lure
  extraction later once the catch evidence is reliable.
*/

function extractLure() {
  return null;
}

function extractMethod(text) {
  if (
    /\blure|luring|lures\b/i.test(text) ||
    /\bplug|hard lure|hardbait|minnow|surface lure|pencil\b/i.test(
      text
    ) ||
    /\bspinning|spinning rod|spinner\b/i.test(text)
  ) {
    return "Lure";
  }

  if (
    /\bsurfcast|surf casting|bait\b/i.test(text)
  ) {
    return "Bait";
  }

  return null;
}


/* ---------------------------------------------------------
   CONFIDENCE
--------------------------------------------------------- */

function calculateConfidence({
  evidenceType,
  markCount,
  localEvidence,
  fishWeightLb,
  fishLengthCm,
  fishCount
}) {
  let score = 0;

  if (evidenceType === "confirmed_catch") {
    score += 50;
  } else if (evidenceType === "activity_mention") {
    score += 25;
  } else if (evidenceType === "regional_report") {
    score += 10;
  }

  if (markCount === 1) {
    score += 20;
  }

  if (localEvidence) {
    score += 10;
  }

  if (fishWeightLb !== null) {
    score += 10;
  }

  if (fishLengthCm !== null) {
    score += 5;
  }

  if (fishCount !== null) {
    score += 5;
  }

  if (score >= 75) {
    return "high";
  }

  if (score >= 45) {
    return "medium";
  }

  return "low";
}


/* ---------------------------------------------------------
   DATE
--------------------------------------------------------- */

function extractDate(text) {
  const patterns = [
    /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/,
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})\b/i
  ];

  const monthNames = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12"
  };

  for (const regex of patterns) {
    const match = text.match(regex);

    if (!match) continue;

    if (regex === patterns[0]) {
      let year = Number(match[3]);

      if (year < 100) {
        year += 2000;
      }

      return `${year}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
    }

    if (/^\d/.test(match[1])) {
      return `${match[3]}-${monthNames[match[2].toLowerCase()]}-${String(match[1]).padStart(2, "0")}`;
    }

    return `${match[3]}-${monthNames[match[1].toLowerCase()]}-${String(match[2]).padStart(2, "0")}`;
  }

  return null;
}


/* ---------------------------------------------------------
   STABLE IDS
--------------------------------------------------------- */

function stableHash(text) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);

    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }

  return (hash >>> 0).toString(16);
}


/* ---------------------------------------------------------
   FETCH
--------------------------------------------------------- */

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: HTTP ${response.status}`
    );
  }

  return response.text();
}


/* ---------------------------------------------------------
   BUILD REPORTS
--------------------------------------------------------- */

function buildReports(html, source) {
  const paragraphs = extractParagraphs(html);

  const reports = [];

  let currentSection =
    "Sea fishing catch reports";

  for (const paragraph of paragraphs) {

    /*
      Short non-fishing paragraphs are treated as
      possible section headings.
    */

    if (
      paragraph.length < 180 &&
      !containsBass(paragraph) &&
      !containsCatchLanguage(paragraph)
    ) {
      currentSection = paragraph;
      continue;
    }

    const marks = findMarks(paragraph);

    /*
      Regional report with no specific mark.
    */

    if (marks.length === 0) {
      if (!containsBass(paragraph)) {
        continue;
      }

      const evidenceType =
        "regional_report";

      reports.push({
        id: stableHash(
          `${source.url}|${currentSection}|regional|${paragraph}`
        ),

        evidenceType,

        scoringEligible:
          scoringEligible(evidenceType),

        markId: null,

        markName: null,

        markConfidence: "low",

        date: extractDate(paragraph),

        time: null,

        species: "Bass",

        fishCount:
          extractFishCount(paragraph),

        fishWeightLb:
          extractWeight(paragraph),

        fishLengthCm:
          extractLength(paragraph),

        method:
          extractMethod(paragraph),

        lure: null,

        notes: paragraph,

        source: source.source,

        sourceUrl: source.url,

        sourceSection: currentSection,

        submittedAt:
          new Date().toISOString(),

        conditions: null,

        verified: false
      });

      continue;
    }

    /*
      A paragraph mentioning multiple marks is never
      allowed to become a confirmed individual catch.
    */

    for (const mark of marks) {
      const localSentences =
        getLocalEvidence(
          paragraph,
          mark.markName
        );

      const localText =
        localSentences.length > 0
          ? localSentences.join(" ")
          : paragraph;

      let evidenceType =
        getEvidenceType(
          localText,
          marks.length
        );

      if (
        marks.length > 1 &&
        evidenceType === "confirmed_catch"
      ) {
        evidenceType =
          "activity_mention";
      }

      const fishWeightLb =
        evidenceType === "confirmed_catch"
          ? extractWeight(localText)
          : null;

      const fishLengthCm =
        evidenceType === "confirmed_catch"
          ? extractLength(localText)
          : null;

      const fishCount =
        evidenceType === "confirmed_catch"
          ? extractFishCount(localText)
          : null;

      const method =
        evidenceType === "confirmed_catch"
          ? extractMethod(localText)
          : null;

      const confidence =
        calculateConfidence({
          evidenceType,
          markCount: marks.length,
          localEvidence:
            localSentences.length > 0,
          fishWeightLb,
          fishLengthCm,
          fishCount
        });

      reports.push({
        id: stableHash(
          `${source.url}|${currentSection}|${mark.markName}|${evidenceType}|${localText}`
        ),

        evidenceType,

        scoringEligible:
          scoringEligible(evidenceType),

        markId: null,

        markName: mark.markName,

        markConfidence:
          marks.length === 1
            ? confidence
            : "low",

        date:
          extractDate(localText) ||
          extractDate(paragraph),

        time: null,

        species: "Bass",

        fishCount,

        fishWeightLb,

        fishLengthCm,

        method,

        lure:
          extractLure(localText),

        notes: localText,

        source: source.source,

        sourceUrl: source.url,

        sourceSection: currentSection,

        submittedAt:
          new Date().toISOString(),

        conditions: null,

        verified: false
      });
    }
  }

  return reports;
}


/* ---------------------------------------------------------
   DEDUPLICATION
--------------------------------------------------------- */

function deduplicateReports(reports) {
  const seen = new Map();

  for (const report of reports) {
    const key = [
      report.markName || "regional",
      report.evidenceType,
      report.date || "unknown",
      normalise(report.notes)
    ].join("|");

    if (!seen.has(key)) {
      seen.set(key, report);
    }
  }

  return Array.from(seen.values());
}


/* ---------------------------------------------------------
   SORTING
--------------------------------------------------------- */

function sortReports(reports) {
  return reports.sort((a, b) => {
    const aDate =
      a.date || "0000-00-00";

    const bDate =
      b.date || "0000-00-00";

    if (aDate !== bDate) {
      return bDate.localeCompare(aDate);
    }

    return String(a.markName || "")
      .localeCompare(
        String(b.markName || "")
      );
  });
}


/* ---------------------------------------------------------
   STABLE OUTPUT
--------------------------------------------------------- */

function comparableReports(reports) {
  return reports.map(report => {
    const copy = { ...report };

    delete copy.submittedAt;

    return copy;
  });
}

function loadExisting() {
  try {
    if (!fs.existsSync(OUTPUT)) {
      return null;
    }

    return JSON.parse(
      fs.readFileSync(
        OUTPUT,
        "utf8"
      )
    );
  } catch {
    return null;
  }
}


/* ---------------------------------------------------------
   MAIN
--------------------------------------------------------- */

async function main() {
  console.log(
    "Bass Finder Wales catch collector starting..."
  );

  const allReports = [];

  for (const source of SOURCE_URLS) {
    console.log(
      `Fetching ${source.source}: ${source.url}`
    );

    try {
      const html =
        await fetchPage(source.url);

      const reports =
        buildReports(
          html,
          source
        );

      console.log(
        `Found ${reports.length} candidate reports from ${source.source}`
      );

      allReports.push(...reports);

    } catch (error) {
      console.error(
        `Source failed: ${source.source}`
      );

      console.error(
        error.message
      );
    }
  }

  const reports =
    sortReports(
      deduplicateReports(
        allReports
      )
    );

  const confirmed =
    reports.filter(
      report =>
        report.evidenceType ===
        "confirmed_catch"
    ).length;

  const activity =
    reports.filter(
      report =>
        report.evidenceType ===
        "activity_mention"
    ).length;

  const regional =
    reports.filter(
      report =>
        report.evidenceType ===
        "regional_report"
    ).length;

  console.log("");
  console.log(
    "Collection complete."
  );
  console.log(
    `Total reports: ${reports.length}`
  );
  console.log(
    `Confirmed catches: ${confirmed}`
  );
  console.log(
    `Activity mentions: ${activity}`
  );
  console.log(
    `Regional reports: ${regional}`
  );
  console.log("");

  const existing =
    loadExisting();

  const oldComparable =
    existing
      ? comparableReports(
          existing.reports || []
        )
      : [];

  const newComparable =
    comparableReports(
      reports
    );

  const changed =
    JSON.stringify(oldComparable) !==
    JSON.stringify(newComparable);

  const generatedAt =
    existing && !changed
      ? existing.generatedAt
      : new Date().toISOString();

  const output = {
    version: 3,

    generatedAt,

    reportCount:
      reports.length,

    confirmedCatchCount:
      confirmed,

    activityMentionCount:
      activity,

    regionalReportCount:
      regional,

    sourceCount:
      SOURCE_URLS.length,

    reports
  };

  fs.mkdirSync(
    path.dirname(OUTPUT),
    { recursive: true }
  );

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      output,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `Saved ${OUTPUT}`
  );

  if (!changed) {
    console.log(
      "No report data changed; generatedAt preserved."
    );
  } else {
    console.log(
      "Report data changed; generatedAt updated."
    );
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

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
  Bass Finder Wales mark aliases.

  The collector only assigns a report to a mark when
  the location is explicitly mentioned in the relevant
  report section.
*/

const MARK_ALIASES = {
  "Monknash": [
    "monknash"
  ],

  "Nash Point": [
    "nash point"
  ],

  "St Donats": [
    "st donats",
    "st. donats"
  ],

  "Llantwit Major": [
    "llantwit major"
  ],

  "Aberthaw": [
    "aberthaw"
  ],

  "Dunraven Bay": [
    "dunraven bay",
    "dunraven"
  ],

  "Southerndown": [
    "southerndown"
  ],

  "Ogmore": [
    "ogmore"
  ],

  "Sker Point": [
    "sker point"
  ],

  "Sker Rocks": [
    "sker rocks",
    "sker rock"
  ],

  "Rest Bay": [
    "rest bay"
  ],

  "Newton Point": [
    "newton point"
  ],

  "Porthcawl Harbour": [
    "porthcawl harbour",
    "porthcawl marina"
  ],

  "Aberavon": [
    "aberavon"
  ],

  "Neath River Mouth": [
    "neath river mouth",
    "neath river",
    "neath mouth"
  ],

  "Swansea West Pier": [
    "swansea west pier",
    "west pier"
  ],

  "Mumbles": [
    "mumbles"
  ],

  "Bracelet Bay": [
    "bracelet bay"
  ],

  "Langland Bay": [
    "langland bay",
    "langland"
  ],

  "Caswell Bay": [
    "caswell bay",
    "caswell"
  ],

  "Brandy Cove": [
    "brandy cove"
  ],

  "Pobbles Bay": [
    "pobbles bay",
    "pobbles"
  ],

  "Three Cliffs Bay": [
    "three cliffs bay",
    "three cliffs"
  ],

  "Oxwich Bay": [
    "oxwich bay",
    "oxwich"
  ],

  "Port Eynon": [
    "port eynon"
  ],

  "Mewslade Bay": [
    "mewslade bay",
    "mewslade"
  ],

  "Llangennith": [
    "llangennith"
  ],

  "Rhossili": [
    "rhossili",
    "worms head",
    "worm's head"
  ],

  "Broughton Bay": [
    "broughton bay"
  ],

  "Whiteford Sands": [
    "whiteford sands",
    "whiteford"
  ],

  "Cefn Sidan": [
    "cefn sidan"
  ],

  "Burry Port North Channel": [
    "burry port north channel",
    "north channel"
  ],

  "Burry Port": [
    "burry port"
  ],

  "Pendine": [
    "pendine"
  ],

  "Freshwater East": [
    "freshwater east"
  ],

  "Manorbier Bay": [
    "manorbier bay"
  ],

  "Manorbier Castle Beach": [
    "manorbier castle beach",
    "manorbier"
  ],

  "Saundersfoot Beach": [
    "saundersfoot beach",
    "saundersfoot"
  ],

  "Saundersfoot Harbour": [
    "saundersfoot harbour"
  ],

  "Broad Haven South": [
    "broad haven south"
  ],

  "Druidston Haven": [
    "druidston haven",
    "druidston"
  ],

  "Angle Bay": [
    "angle bay"
  ],

  "Pembroke River": [
    "pembroke river"
  ],

  "Freshwater West": [
    "freshwater west"
  ]
};


/* -------------------------------------------------------
   HTML CLEANING
------------------------------------------------------- */

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&#8211;/gi, "-")
    .replace(/&#8212;/gi, "-")
    .replace(/&quot;/gi, '"')
    .replace(/&pound;/gi, "£");
}


function cleanText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim()
  );
}


/* -------------------------------------------------------
   REPORT SECTION EXTRACTION
------------------------------------------------------- */

/*
  Fishing in Wales uses a normal article page.

  Instead of treating the whole page as one report,
  we split it into logical blocks using headings and
  substantial paragraphs.

  This is intentionally dependency-free so GitHub Actions
  can run it with plain Node.js.
*/

function extractSections(html) {
  const sections = [];

  const headingRegex =
    /<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/gi;

  const headings = [];

  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      start: match.index,
      end: headingRegex.lastIndex,
      title: cleanText(match[2])
    });
  }

  if (!headings.length) {
    return [
      {
        title: "Fishing in Wales sea fishing catch reports",
        text: cleanText(html)
      }
    ];
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];

    const contentStart = heading.end;

    const contentEnd =
      i + 1 < headings.length
        ? headings[i + 1].start
        : html.length;

    const contentHtml =
      html.slice(contentStart, contentEnd);

    const text = cleanText(contentHtml);

    if (text.length < 80) {
      continue;
    }

    sections.push({
      title: heading.title,
      text
    });
  }

  return sections;
}


/* -------------------------------------------------------
   BASS DETECTION
------------------------------------------------------- */

function containsBass(text) {
  const lower = text.toLowerCase();

  return (
    /\bbass\b/i.test(lower) ||
    /sea bass/i.test(lower) ||
    /bass fishing/i.test(lower) ||
    /bass fishing with lures/i.test(lower)
  );
}


/* -------------------------------------------------------
   MARK MATCHING
------------------------------------------------------- */

function findMarks(text) {
  const lower = text.toLowerCase();

  const matches = [];

  for (const [mark, aliases] of Object.entries(MARK_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(alias.toLowerCase())) {
        matches.push({
          mark,
          alias
        });

        break;
      }
    }
  }

  /*
    Longest aliases first helps prevent things such as
    "Saundersfoot Harbour" being treated only as
    "Saundersfoot".
  */

  matches.sort(
    (a, b) =>
      b.alias.length - a.alias.length
  );

  return matches;
}


/* -------------------------------------------------------
   DATE EXTRACTION
------------------------------------------------------- */

function extractDate(text) {
  const patterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,

    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i,

    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return null;
}


/* -------------------------------------------------------
   TIME EXTRACTION
------------------------------------------------------- */

function extractTime(text) {
  const patterns = [
    /\b([01]?\d|2[0-3]):[0-5]\d\b/,
    /\b([1-9]|1[0-2])(?:\.[0-5]\d)?\s?(?:am|pm)\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return match[0];
    }
  }

  return null;
}


/* -------------------------------------------------------
   FISH COUNT
------------------------------------------------------- */

function extractFishCount(text) {
  const patterns = [
    /\b(\d+)\s+bass\b/i,
    /\b(\d+)\s+sea bass\b/i,
    /\b(\d+)\s+bass caught\b/i,
    /\bcaught\s+(\d+)\s+bass\b/i,
    /\blanded\s+(\d+)\s+bass\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}


/* -------------------------------------------------------
   FISH SIZE / WEIGHT
------------------------------------------------------- */

function extractWeight(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*lb\b/i,
    /(\d+(?:\.\d+)?)\s*lbs\b/i,
    /(\d+(?:\.\d+)?)\s*pounds?\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}


function extractLength(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:cm|cms|centimetres|centimeters)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:in|inch|inches)\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}


/* -------------------------------------------------------
   METHOD / LURE
------------------------------------------------------- */

function extractMethod(text) {
  const methods = [
    "soft plastic",
    "lure",
    "lures",
    "spinning",
    "spinner",
    "plug",
    "jig",
    "bait",
    "fly"
  ];

  const lower = text.toLowerCase();

  return (
    methods.find(method =>
      lower.includes(method)
    ) || null
  );
}


function extractLure(text) {
  const lurePatterns = [
    /(?:using|on|with|caught on|caught using)\s+(?:a\s+)?([A-Za-z0-9' -]{3,50})\s+(?:lure|plug|jig)/i,
    /(?:lure|plug|jig)\s+(?:called|named)\s+([A-Za-z0-9' -]{3,50})/i
  ];

  for (const pattern of lurePatterns) {
    const match = text.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  return null;
}


/* -------------------------------------------------------
   EXCERPT
------------------------------------------------------- */

function buildExcerpt(text) {
  const clean = text
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= 1200) {
    return clean;
  }

  return clean.slice(0, 1200) + "...";
}


/* -------------------------------------------------------
   CONFIDENCE
------------------------------------------------------- */

function calculateConfidence({
  sectionTitle,
  text,
  markCount,
  date
}) {
  let score = 0;

  if (sectionTitle && sectionTitle.length > 5) {
    score += 1;
  }

  if (text.length > 150) {
    score += 1;
  }

  if (markCount === 1) {
    score += 2;
  }

  if (date) {
    score += 1;
  }

  if (/\bbass\b/i.test(text)) {
    score += 1;
  }

  if (score >= 5) {
    return "high";
  }

  if (score >= 3) {
    return "medium";
  }

  return "low";
}


/* -------------------------------------------------------
   STABLE ID
------------------------------------------------------- */

function makeId(source, sectionTitle, mark, text) {
  const raw =
    `${source}|${sectionTitle}|${mark}|${text}`
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  let hash = 0;

  for (let i = 0; i < raw.length; i++) {
    hash =
      (hash << 5) -
      hash +
      raw.charCodeAt(i);

    hash |= 0;
  }

  return `external-${Math.abs(hash)}`;
}


/* -------------------------------------------------------
   SOURCE FETCH
------------------------------------------------------- */

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent":
        "Bass-Finder-Wales/1.0 catch-report collector"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${source.name}: HTTP ${response.status}`
    );
  }

  return response.text();
}


/* -------------------------------------------------------
   BUILD REPORTS
------------------------------------------------------- */

function buildReports(source, html) {
  const sections = extractSections(html);

  const reports = [];

  for (const section of sections) {
    if (!containsBass(section.text)) {
      continue;
    }

    const marks = findMarks(section.text);

    /*
      We do not create a mark-specific report when the
      location cannot be identified.

      This prevents generic Welsh bass discussion from
      contaminating individual marks.
    */

    if (!marks.length) {
      continue;
    }

    /*
      If multiple marks are mentioned in the same section,
      create a report for each mark but lower confidence.
    */

    for (const markMatch of marks) {
      const mark = markMatch.mark;

      const confidence =
        calculateConfidence({
          sectionTitle: section.title,
          text: section.text,
          markCount: marks.length,
          date: extractDate(
            section.title +
            " " +
            section.text
          )
        });

      const combinedText =
        `${section.title}\n${section.text}`;

      const report = {
        id: makeId(
          source.name,
          section.title,
          mark,
          section.text
        ),

        source: source.name,

        sourceUrl: source.url,

        sourceSection: section.title,

        markName: mark,

        date: extractDate(
          combinedText
        ),

        time: extractTime(
          section.text
        ),

        species: "Bass",

        fishCount: extractFishCount(
          section.text
        ),

        fishWeightLb: extractWeight(
          section.text
        ),

        fishLength: extractLength(
          section.text
        ),

        method: extractMethod(
          section.text
        ),

        lure: extractLure(
          section.text
        ),

        notes: buildExcerpt(
          section.text
        ),

        conditions: null,

        collectedAt:
          new Date().toISOString(),

        confidence,

        sourceType: "external",

        verified: false
      };

      reports.push(report);
    }
  }

  return reports;
}


/* -------------------------------------------------------
   MAIN
------------------------------------------------------- */

async function main() {
  fs.mkdirSync(
    path.dirname(OUTPUT),
    {
      recursive: true
    }
  );

  const allReports = [];

  for (const source of SOURCE_URLS) {
    try {
      console.log(
        `Checking ${source.name}...`
      );

      const html =
        await fetchSource(source);

      const sourceReports =
        buildReports(
          source,
          html
        );

      allReports.push(
        ...sourceReports
      );

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


  /*
    Remove duplicates.

    The stable ID means the same report should not
    continually create new entries on every scheduled run.
  */

  const unique =
    Array.from(
      new Map(
        allReports.map(report => [
          report.id,
          report
        ])
      ).values()
    );


  const output = {
    version: 2,

    generatedAt:
      new Date().toISOString(),

    reportCount:
      unique.length,

    reports:
      unique
  };


  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      output,
      null,
      2
    )
  );


  console.log(
    `Saved ${unique.length} external reports to ${OUTPUT}`
  );
}


main().catch(error => {
  console.error(error);
  process.exit(1);
});

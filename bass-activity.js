/* =========================================================
   BASS FINDER WALES — BASS ACTIVITY ENGINE
   Version 1.0

   Stores catch reports and blank sessions locally.
   Designed to later connect with live weather/marine data
   and external catch reports.

   IMPORTANT:
   - No environmental conditions are manually entered.
   - Conditions can be attached automatically from the
     date/time/mark in a later stage.
   ========================================================= */

const BASS_ACTIVITY_VERSION = "1.0";

const BASS_REPORT_STORAGE_KEY = "bassFinderReportsV1";

/* ---------------------------------------------------------
   STORAGE
   --------------------------------------------------------- */

function getBassReports() {
  try {
    const saved = localStorage.getItem(BASS_REPORT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("Bass Finder: unable to read reports", error);
    return [];
  }
}

function saveBassReports(reports) {
  try {
    localStorage.setItem(
      BASS_REPORT_STORAGE_KEY,
      JSON.stringify(reports)
    );
    return true;
  } catch (error) {
    console.warn("Bass Finder: unable to save reports", error);
    return false;
  }
}

/* ---------------------------------------------------------
   CREATE REPORT
   --------------------------------------------------------- */

function createBassReport(data) {

  const report = {
    id:
      "report_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8),

    type: data.type || "catch",

    markId: data.markId || "",
    markName: data.markName || "",

    date: data.date || "",
    time: data.time || "",

    species: data.species || "Bass",

    fishCount: Number(data.fishCount || 1),

    fishLength:
      data.fishLength !== undefined &&
      data.fishLength !== ""
        ? Number(data.fishLength)
        : null,

    method: data.method || "",

    lure: data.lure || "",

    notes: data.notes || "",

    photo: data.photo || null,

    submittedAt: new Date().toISOString(),

    /* Reserved for automatic environmental matching */
    conditions: data.conditions || null,

    /* Reserved for future source/verification system */
    source: data.source || "user",

    verified: Boolean(data.verified)
  };

  const reports = getBassReports();

  reports.push(report);

  saveBassReports(reports);

  return report;
}

/* ---------------------------------------------------------
   REPORT TYPES
   --------------------------------------------------------- */

function addBassCatch(data) {
  return createBassReport({
    ...data,
    type: "catch",
    species: "Bass"
  });
}

function addBassBlank(data) {
  return createBassReport({
    ...data,
    type: "blank"
  });
}

/* ---------------------------------------------------------
   DELETE REPORT
   --------------------------------------------------------- */

function deleteBassReport(reportId) {

  const reports = getBassReports();

  const filtered = reports.filter(
    report => report.id !== reportId
  );

  saveBassReports(filtered);

  return filtered;
}

/* ---------------------------------------------------------
   CLEAR ALL REPORTS
   --------------------------------------------------------- */

function clearBassReports() {
  localStorage.removeItem(BASS_REPORT_STORAGE_KEY);
}

/* ---------------------------------------------------------
   DATE / TIME HELPERS
   --------------------------------------------------------- */

function reportDateTime(report) {

  if (!report.date || !report.time) {
    return null;
  }

  const date = new Date(
    `${report.date}T${report.time}`
  );

  return isNaN(date.getTime()) ? null : date;
}

function daysSinceReport(report) {

  const date = reportDateTime(report);

  if (!date) return 9999;

  const now = new Date();

  return Math.max(
    0,
    (now - date) / 86400000
  );
}

/* ---------------------------------------------------------
   RECENCY WEIGHT
   ---------------------------------------------------------

   Recent catches matter considerably more than old ones.

   <1 day       = 1.00
   1–3 days     = 0.90
   4–7 days     = 0.70
   8–14 days    = 0.50
   15–30 days   = 0.30
   31–60 days   = 0.15
   60+ days     = 0.05
   --------------------------------------------------------- */

function bassReportRecencyWeight(report) {

  const days = daysSinceReport(report);

  if (days < 1) return 1.00;
  if (days < 3) return 0.90;
  if (days < 7) return 0.70;
  if (days < 14) return 0.50;
  if (days < 30) return 0.30;
  if (days < 60) return 0.15;

  return 0.05;
}

/* ---------------------------------------------------------
   SEASONAL WEIGHT
   --------------------------------------------------------- */

function getSeason(dateString) {

  if (!dateString) return null;

  const month =
    new Date(`${dateString}T12:00:00`).getMonth();

  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";

  return "autumn";
}

function seasonalWeight(report) {

  const reportSeason = getSeason(report.date);

  if (!reportSeason) return 1;

  const currentSeason =
    getSeason(
      new Date().toISOString().slice(0, 10)
    );

  return reportSeason === currentSeason
    ? 1
    : 0.65;
}

/* ---------------------------------------------------------
   REPORT QUALITY
   --------------------------------------------------------- */

function reportQualityWeight(report) {

  let weight = 1;

  if (report.type === "catch") {

    if (report.fishCount > 0) {
      weight += 0.10;
    }

    if (report.fishLength) {
      weight += 0.10;
    }

    if (report.method) {
      weight += 0.05;
    }

    if (report.lure) {
      weight += 0.05;
    }
  }

  if (report.verified) {
    weight += 0.25;
  }

  return weight;
}

/* ---------------------------------------------------------
   EFFECTIVE REPORT WEIGHT
   --------------------------------------------------------- */

function effectiveReportWeight(report) {

  return (
    bassReportRecencyWeight(report) *
    seasonalWeight(report) *
    reportQualityWeight(report)
  );
}

/* ---------------------------------------------------------
   MARK REPORTS
   --------------------------------------------------------- */

function getReportsForMark(markId) {

  return getBassReports().filter(
    report => report.markId === markId
  );
}

/* ---------------------------------------------------------
   BASS ACTIVITY
   ---------------------------------------------------------

   Returns a 0–100 activity score.

   This deliberately starts conservatively.

   We don't want three reports suddenly turning a mark
   into a guaranteed 95/100 fishing opportunity.

   More data = more confidence.
   --------------------------------------------------------- */

function calculateBassActivity(markId) {

  const reports =
    getReportsForMark(markId);

  if (!reports.length) {

    return {
      score: 50,
      signal: 0,
      confidence: 0,
      catches: 0,
      blanks: 0,
      weightedCatches: 0,
      weightedBlanks: 0,
      reports: 0,
      label: "NO DATA"
    };
  }

  let weightedCatches = 0;
  let weightedBlanks = 0;

  reports.forEach(report => {

    const weight =
      effectiveReportWeight(report);

    if (report.type === "catch") {

      weightedCatches +=
        Math.max(1, report.fishCount || 1) *
        weight;

    } else if (report.type === "blank") {

      weightedBlanks += weight;
    }
  });

  const total =
    weightedCatches +
    weightedBlanks;

  if (!total) {

    return {
      score: 50,
      signal: 0,
      confidence: 0,
      catches: 0,
      blanks: 0,
      weightedCatches: 0,
      weightedBlanks: 0,
      reports: reports.length,
      label: "NO DATA"
    };
  }

  /*
     Activity rate.

     Catches have a stronger influence than blanks,
     but blanks still actively suppress the score.
  */

  const catchRate =
    weightedCatches /
    (weightedCatches + weightedBlanks);

  let score =
    35 +
    catchRate * 65;

  /*
     Avoid extreme scores when the sample size is tiny.
  */

  const evidenceFactor =
    Math.min(1, total / 8);

  score =
    50 +
    (score - 50) *
    evidenceFactor;

  score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );

  const signal =
    Math.round(
      (score - 50) * 0.4
    );

  const confidence =
    Math.round(
      Math.min(
        95,
        15 +
        total * 7
      )
    );

  let label = "NEUTRAL";

  if (score >= 82) {
    label = "VERY HIGH";
  } else if (score >= 68) {
    label = "HIGH";
  } else if (score >= 55) {
    label = "POSITIVE";
  } else if (score <= 30) {
    label = "VERY LOW";
  } else if (score <= 42) {
    label = "LOW";
  }

  return {

    score,

    signal,

    confidence,

    catches: reports.filter(
      r => r.type === "catch"
    ).length,

    blanks: reports.filter(
      r => r.type === "blank"
    ).length,

    weightedCatches:
      Number(weightedCatches.toFixed(2)),

    weightedBlanks:
      Number(weightedBlanks.toFixed(2)),

    reports: reports.length,

    label
  };
}

/* ---------------------------------------------------------
   CONDITIONS MATCHING — RESERVED
   ---------------------------------------------------------

   Later, every catch/blank will automatically receive
   conditions from Open-Meteo using the recorded mark,
   date and time.

   Example:

   report.conditions = {
     tideState: "ebb",
     tideRate: 0.42,
     windSpeed: 14,
     windDirection: 235,
     gusts: 21,
     swellHeight: 0.7,
     swellPeriod: 8,
     swellDirection: 245,
     waveHeight: 0.8,
     wavePeriod: 7,
     waveDirection: 250,
     rainfall: 0,
     cloud: 72,
     seaTemperature: 15.8
   };

   This means the angler never has to estimate conditions.
   --------------------------------------------------------- */

function attachConditionsToReport(
  reportId,
  conditions
) {

  const reports = getBassReports();

  const report =
    reports.find(
      r => r.id === reportId
    );

  if (!report) return null;

  report.conditions = conditions;

  saveBassReports(reports);

  return report;
}

/* ---------------------------------------------------------
   MARK SUMMARY
   --------------------------------------------------------- */

function getBassActivitySummary(markId) {

  const activity =
    calculateBassActivity(markId);

  const reports =
    getReportsForMark(markId);

  const latestCatch =
    reports
      .filter(r => r.type === "catch")
      .sort(
        (a, b) =>
          new Date(
            `${b.date}T${b.time}`
          ) -
          new Date(
            `${a.date}T${a.time}`
          )
      )[0] || null;

  return {

    ...activity,

    latestCatch,

    latestReport:
      reports
        .sort(
          (a, b) =>
            new Date(b.submittedAt) -
            new Date(a.submittedAt)
        )[0] || null
  };
}

/* ---------------------------------------------------------
   DATABASE EXPORT
   --------------------------------------------------------- */

function exportBassReports() {

  const reports =
    getBassReports();

  return JSON.stringify(
    reports,
    null,
    2
  );
}

/* ---------------------------------------------------------
   DATABASE IMPORT
   --------------------------------------------------------- */

function importBassReports(json) {

  try {

    const imported =
      JSON.parse(json);

    if (!Array.isArray(imported)) {
      throw new Error(
        "Invalid report database"
      );
    }

    saveBassReports(imported);

    return true;

  } catch (error) {

    console.warn(
      "Bass Finder: import failed",
      error
    );

    return false;
  }
}

/* ---------------------------------------------------------
   DEBUG / TEST
   --------------------------------------------------------- */

function bassActivityDebug() {

  const reports =
    getBassReports();

  console.log(
    "Bass Finder Bass Activity Engine",
    BASS_ACTIVITY_VERSION
  );

  console.log(
    "Stored reports:",
    reports.length
  );

  return reports;
}

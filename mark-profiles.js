/* =========================================================
   BASS FINDER WALES — MARK PROFILES
   Research-based Fishing DNA
   ========================================================= */

const DEFAULT_MARK_PROFILE = {
  tideReference: "low",

  primeBeforeHours: 3,
  primeAfterHours: 2,

  tideRangePreference: "neutral",

  dawnBoost: 5,
  duskBoost: 5,
  nightBoost: 0,

  confidence: "baseline",

  sources: []
};


/* =========================================================
   MARK-SPECIFIC PROFILES
   ========================================================= */

const MARK_PROFILES = {

  /* -------------------------------------------------------
     ABERTHAW
     ------------------------------------------------------- */

  aberthaw: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 3,
    primeAfterHours: 1,

    tideRangePreference: "small",

    dawnBoost: 5,
    duskBoost: 5,
    nightBoost: 2,

    confidence: "high",

    sources: [
      "Mumbles Motor Boat & Fishing Club",
      "SeaAngler",
      "Total Fishing"
    ]
  },


  /* -------------------------------------------------------
     BRANDY COVE
     ------------------------------------------------------- */

  brandyCove: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "small",

    dawnBoost: 6,
    duskBoost: 7,
    nightBoost: 6,

    confidence: "medium",

    sources: [
      "SeaAngler",
      "local angler reports"
    ]
  },


  /* -------------------------------------------------------
     NEWTON POINT
     ------------------------------------------------------- */

  newtonPoint: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "neutral",

    dawnBoost: 5,
    duskBoost: 5,
    nightBoost: 2,

    confidence: "high",

    sources: [
      "SeaAngler",
      "AnglersWorld"
    ]
  },


  /* -------------------------------------------------------
     THREE CLIFFS BAY
     ------------------------------------------------------- */

  threeCliffsBay: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 2,
    primeAfterHours: 2,

    tideRangePreference: "mid",

    dawnBoost: 6,
    duskBoost: 7,
    nightBoost: 3,

    confidence: "high",

    sources: [
      "SeaAngler"
    ]
  },


  /* -------------------------------------------------------
     LLANGENNITH
     ------------------------------------------------------- */

  llangennith: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 2,
    primeAfterHours: 1,

    tideRangePreference: "mid",

    dawnBoost: 6,
    duskBoost: 8,
    nightBoost: 6,

    confidence: "high",

    sources: [
      "SeaAngler"
    ]
  },


  /* -------------------------------------------------------
     GREEN BANKS / LOUGHOR
     ------------------------------------------------------- */

  greenBanks: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "small",

    dawnBoost: 5,
    duskBoost: 5,
    nightBoost: 2,

    confidence: "high",

    sources: [
      "SeaAngler"
    ]
  },


  /* -------------------------------------------------------
     PORTHCAWL BREAKWATER
     ------------------------------------------------------- */

  porthcawlBreakwater: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 3,

    tideRangePreference: "neutral",

    dawnBoost: 5,
    duskBoost: 6,
    nightBoost: 3,

    confidence: "high",

    sources: [
      "SeaAngler",
      "AnglersWorld"
    ]
  },


  /* -------------------------------------------------------
     OGmore
     ------------------------------------------------------- */

  ogmore: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 1,
    primeAfterHours: 3,

    tideRangePreference: "neutral",

    dawnBoost: 5,
    duskBoost: 6,
    nightBoost: 2,

    confidence: "high",

    sources: [
      "SeaAngler"
    ]
  },


  /* -------------------------------------------------------
     MUMBLES HEAD
     ------------------------------------------------------- */

  mumblesHead: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 2,
    primeAfterHours: 2,

    tideRangePreference: "small",

    dawnBoost: 7,
    duskBoost: 7,
    nightBoost: 2,

    confidence: "high",

    sources: [
      "SeaAngler",
      "AnglersWorld"
    ]
  },


  /* -------------------------------------------------------
     REST BAY POINT
     ------------------------------------------------------- */

  restBayPoint: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 1,

    tideRangePreference: "neutral",

    dawnBoost: 6,
    duskBoost: 7,
    nightBoost: 4,

    confidence: "medium",

    sources: [
      "local fishing guides"
    ]
  },


  /* -------------------------------------------------------
     SKER ROCKS
     ------------------------------------------------------- */

  skerRocks: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "low",

    primeBeforeHours: 2,
    primeAfterHours: 2,

    tideRangePreference: "neutral",

    dawnBoost: 7,
    duskBoost: 7,
    nightBoost: 3,

    confidence: "medium",

    sources: [
      "local fishing guides"
    ]
  },


  /* -------------------------------------------------------
     NASH POINT
     ------------------------------------------------------- */

  nashPoint: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "neutral",

    dawnBoost: 5,
    duskBoost: 6,
    nightBoost: 5,

    confidence: "medium",

    sources: [
      "local fishing guides"
    ]
  },


  /* -------------------------------------------------------
     SOUTHERNDOWN / DUNRAVEN
     ------------------------------------------------------- */

  southerndown: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "neutral",

    dawnBoost: 6,
    duskBoost: 8,
    nightBoost: 6,

    confidence: "medium",

    sources: [
      "local fishing guides"
    ]
  },


  /* -------------------------------------------------------
     MONKNASH
     ------------------------------------------------------- */

  monknash: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 1,

    tideRangePreference: "neutral",

    dawnBoost: 5,
    duskBoost: 6,
    nightBoost: 4,

    confidence: "medium",

    sources: [
      "local fishing guides",
      "SeaAngler"
    ]
  },


  /* -------------------------------------------------------
     OXWICH
     ------------------------------------------------------- */

  oxwich: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "neutral",

    dawnBoost: 6,
    duskBoost: 7,
    nightBoost: 3,

    confidence: "medium",

    sources: [
      "Where's The Fish"
    ]
  },


  /* -------------------------------------------------------
     BURY PORT
     ------------------------------------------------------- */

  burryPort: {
    ...DEFAULT_MARK_PROFILE,

    tideReference: "high",

    primeBeforeHours: 3,
    primeAfterHours: 2,

    tideRangePreference: "neutral",

    dawnBoost: 6,
    duskBoost: 7,
    nightBoost: 3,

    confidence: "medium",

    sources: [
      "Where's The Fish",
      "SeaAngler",
      "Fishing in Wales"
    ]
  }

};


/* =========================================================
   PROFILE LOOKUP
   ========================================================= */

function getMarkProfile(mark) {

  if (!mark) {
    return DEFAULT_MARK_PROFILE;
  }

  const name =
    typeof mark === "string"
      ? mark
      : mark.name || mark.markName || mark.id || "";

  const normalised =
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const profileKey =
    Object.keys(MARK_PROFILES).find(key => {

      const keyNormalised =
        key
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      return (
        normalised === keyNormalised ||
        normalised.includes(keyNormalised) ||
        keyNormalised.includes(normalised)
      );

    });

  return profileKey
    ? MARK_PROFILES[profileKey]
    : DEFAULT_MARK_PROFILE;
}

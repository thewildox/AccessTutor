const PEER_KEY = "focusly_study_peer_v1";
const INTEREST_KEY = "focusly_special_interest_v1";
const ENGAGEMENT_HINT_KEY = "focusly_last_engagement_hint_v1";

/** @typedef {{ studyPeer: boolean, specialInterest: string }} StudyCompanionPrefs */

export function loadStudyCompanionPrefs() {
  try {
    const studyPeer = localStorage.getItem(PEER_KEY) === "1";
    const specialInterest = localStorage.getItem(INTEREST_KEY) || "";
    return { studyPeer, specialInterest };
  } catch {
    return { studyPeer: false, specialInterest: "" };
  }
}

/** @param {StudyCompanionPrefs} prefs */
export function saveStudyCompanionPrefs(prefs) {
  try {
    localStorage.setItem(PEER_KEY, prefs.studyPeer ? "1" : "0");
    localStorage.setItem(INTEREST_KEY, prefs.specialInterest.slice(0, 200));
  } catch {
    /* private mode */
  }
}

/** Optional hint for next Gemini lesson (e.g. learner looked away often). Max length capped. */
export function setLastEngagementHintForNextLesson(text) {
  try {
    if (!text) sessionStorage.removeItem(ENGAGEMENT_HINT_KEY);
    else sessionStorage.setItem(ENGAGEMENT_HINT_KEY, text.slice(0, 400));
  } catch {
    /* */
  }
}

export function consumeLastEngagementHintForNextLesson() {
  try {
    const v = sessionStorage.getItem(ENGAGEMENT_HINT_KEY);
    sessionStorage.removeItem(ENGAGEMENT_HINT_KEY);
    return v || "";
  } catch {
    return "";
  }
}

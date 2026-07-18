export type EditorialStatus = "verified" | "review";

export type PersonEligibilityReason =
  | "ACTOR"
  | "DIRECTOR"
  | "ARCHIVE_FOOTAGE"
  | "SELF_APPEARANCE"
  | "HISTORICAL_FIGURE"
  | "INTERVIEWEE"
  | "NARRATOR"
  | "VOICE_ONLY"
  | "UNVERIFIED";

export type PersonEditorial = {
  slug: string;
  preferredName?: string;
  countrySlug?: string;
  status?: EditorialStatus;
  featured?: boolean;
  whyMatters?: string;
  preferredBiography?: string;
  hidden?: boolean;
  eligibilityReason?: PersonEligibilityReason;
  aliases?: string[];
  reason?: string;
};

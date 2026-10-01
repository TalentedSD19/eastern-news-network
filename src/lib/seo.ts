// Next.js merges `openGraph` shallowly: a page that sets its own `openGraph`
// drops the root layout's siteName/locale/images entirely. Spread these into
// every page-level openGraph so share cards keep the site identity and an image.
export const SITE_URL = "https://easternnewsnetwork.com";
export const SITE_NAME = "Eastern News Network";

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/android-chrome-512x512.png`,
  width: 512,
  height: 512,
  alt: SITE_NAME,
};

export const baseOpenGraph = {
  siteName: SITE_NAME,
  locale: "en_IN",
};

// JSON.stringify doesn't escape "<", so a title containing "</script>" would
// break out of an inline ld+json block.
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is currently rendered per request (force-dynamic), so there is nothing
// for an incremental cache to store yet. Add the R2 incremental cache here when
// pages move to time-based revalidation: https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({});

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // R2 incremental cache can be enabled later when an R2 bucket is configured:
  // import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
  // incrementalCache: r2IncrementalCache,
});

/**
 * Server-side configuration. Secrets are read ONLY here (server runtime).
 * NEVER prefix these with NEXT_PUBLIC_ and never import this file from a
 * client component — doing so would risk leaking config into the bundle.
 */
export const config = {
  dmrcApiKey: process.env.DMRC_API_KEY ?? "",
  dmrcApiUrl: process.env.DMRC_API_URL ?? "",
  get dmrcConfigured(): boolean {
    return Boolean(process.env.DMRC_API_URL && process.env.DMRC_API_KEY);
  },
};

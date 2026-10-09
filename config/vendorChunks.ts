/** Separate framework and UI dependencies so cached files survive application updates. */
export function vendorChunk(id: string): string | undefined {
  if (!id.includes("/node_modules/")) return;
  if (/\/node_modules\/(react|react-dom|react-is|scheduler)\//.test(id)) return "react-runtime";
  if (/\/node_modules\/(@mui|@emotion)\//.test(id)) return "material-ui";
  return "vendor";
}

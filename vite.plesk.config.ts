import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const project = fileURLToPath(new URL(".", import.meta.url));

function staticBoundary(): Plugin {
  return {
    name: "plesk-static-boundary",
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;
        for (const id of Object.keys(item.modules)) {
          if (/client\.server\.|auth-middleware\.|cron-auth\.|\/src\/(?:start|server)\.ts|\/node_modules\/(?:nitro|wrangler|@cloudflare|@tanstack\/react-start)\//.test(id)) {
            this.error(`Plesk static build cannot include server module: ${id}`);
          }
        }
        if (/sb_secret_[A-Za-z0-9_-]{20,}|["']role["']\s*:\s*["']service_role/.test(item.code)) {
          this.error("A server-only credential was detected in the Plesk bundle");
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, project, "VITE_");
  const url = env["VITE_SUPABASE_URL"];
  const key = env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before building");
  if (new URL(url).protocol !== "https:") throw new Error("The production backend URL must use HTTPS");
  if (!key.startsWith("sb_publishable_")) {
    let role: unknown;
    try { role = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString())["role"]; } catch { /* rejected below */ }
    if (role !== "anon") throw new Error("Only a publishable or legacy anon key can be bundled");
  }
  return {
    root: path.join(project, "deployment/plesk"),
    publicDir: path.join(project, "public"),
    envDir: project,
    // Do not expose arbitrary VITE_ variables; allow only these public values.
    envPrefix: [],
    define: {
      "import.meta.env.VITE_PLESK_STATIC": JSON.stringify("true"),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(url),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(key),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(env["VITE_SUPABASE_PROJECT_ID"] ?? ""),
    },
    resolve: { alias: { "@": path.join(project, "src"), "/src": path.join(project, "src") } },
    plugins: [react(), tailwindcss(), staticBoundary()],
    base: "/",
    build: { outDir: path.join(project, ".output/plesk-upload"), emptyOutDir: true, sourcemap: false },
  };
});
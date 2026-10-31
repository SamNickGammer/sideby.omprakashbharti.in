// Start the local media plane and its mandatory session supervisor together.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
if (
  process.env.NEON_BRANCH !== "dev" ||
  process.env.LIVEKIT_API_URL !== "http://127.0.0.1:7880"
)
  throw Error("This runner is for loopback Neon dev only.");
if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET)
  throw Error(
    "Configure local LiveKit credentials first; see docs/LIVE_SHARING.md.",
  );
const dir = mkdtempSync(join(tmpdir(), "sideby-live-")),
  config = join(dir, "server.yaml");
writeFileSync(
  config,
  JSON.stringify({
    port: 7880,
    bind_addresses: ["127.0.0.1"],
    rtc: {
      tcp_port: 7881,
      node_ip: "127.0.0.1",
      use_external_ip: false,
      enable_loopback_candidate: true,
    },
    keys: { [process.env.LIVEKIT_API_KEY]: process.env.LIVEKIT_API_SECRET },
    logging: { level: "warn" },
  }),
  { mode: 0o600 },
);
const media = spawn("livekit-server", ["--config", config], {
  stdio: "inherit",
});
const supervisor = spawn(process.execPath, ["scripts/live-supervisor.mjs"], {
  stdio: "inherit",
  env: process.env,
});
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  media.kill("SIGTERM");
  supervisor.kill("SIGTERM");
  rmSync(dir, { recursive: true, force: true });
}
for (const child of [media, supervisor]) {
  child.on("error", () => {
    console.error(
      "Local media failed to start. Install LiveKit and check the configured ports.",
    );
    process.exitCode = 1;
    stop();
  });
  child.on("exit", (code) => {
    if (!stopping) {
      process.exitCode = code || 1;
      stop();
    }
  });
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);

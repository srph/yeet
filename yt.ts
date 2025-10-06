import { Innertube, UniversalCache } from "youtubei.js";
import { env } from "./env.server";

export async function createInnertube() {
  return await Innertube.create({
    lang: "en",
    location: "US",
    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    enable_safety_mode: true,
    generate_session_locally: true,
    enable_session_cache: true,
    device_category: "desktop",
    timezone: "America/New_York",
    player_id: env.PLAYER_ID,
    cache: new UniversalCache(false),
  });
}

import { cookies } from "next/headers";
import { resolveSafeTimeZone, timeZoneCookieName } from "@/lib/time-zone";

export async function getServerTimeZone() {
  try {
    const cookieStore = await cookies();
    return resolveSafeTimeZone(cookieStore.get(timeZoneCookieName)?.value);
  } catch {
    return resolveSafeTimeZone(null);
  }
}

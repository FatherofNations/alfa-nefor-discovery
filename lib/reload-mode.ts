import { headers } from "next/headers";

/* Отличаем hard reload от обычного по заголовкам запроса документа:
   - Chrome/Edge, обычный reload:      cache-control: max-age=0
   - Chrome/Edge, hard reload:         cache-control: no-cache + pragma: no-cache
   - Firefox, hard reload:             pragma: no-cache, cache-control: no-cache
   Обычная навигация по ссылке заголовков не несёт. */
export async function isHardReload(): Promise<boolean> {
  const incoming = await headers();
  const cacheControl = (incoming.get("cache-control") ?? "").toLowerCase();
  const pragma = (incoming.get("pragma") ?? "").toLowerCase();
  return cacheControl.includes("no-cache") || pragma.includes("no-cache");
}

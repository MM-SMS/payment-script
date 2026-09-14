import { lookupBin } from "../bin-lookup";
import { normalizeBin, type BinInfo } from "../bin";
import type { PaymentErrorBody } from "../types";

function json(body: BinInfo | PaymentErrorBody | { bin: string }, status = 200) {
  return Response.json(body, { status });
}

export function createBinLookupRouteHandlers() {
  return {
    async GET(request: Request) {
      const raw = new URL(request.url).searchParams.get("bin") ?? "";
      const bin = normalizeBin(raw);

      if (!bin) {
        return json({ error: "Provide 6–8 card digits (BIN only)." }, 400);
      }

      if (!/^\d{6,8}$/.test(raw.replace(/\D/g, "").slice(0, 8))) {
        return json({ error: "BIN must be numeric." }, 400);
      }

      const info = await lookupBin(bin);
      if (!info) {
        return json({ bin: bin.slice(0, 6) });
      }

      return json(info);
    },
  };
}

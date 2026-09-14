"use client";

import { useEffect, useState } from "react";
import { normalizeBin, type BinInfo } from "../bin";

export function useBinLookup(cardNumber: string, endpoint?: string): BinInfo | null {
  const [info, setInfo] = useState<BinInfo | null>(null);

  useEffect(() => {
    const bin = normalizeBin(cardNumber);
    if (!bin || !endpoint) {
      setInfo(null);
      return;
    }

    setInfo((current) => (current && bin.startsWith(current.bin) ? current : null));

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetch(`${endpoint}?bin=${encodeURIComponent(bin)}`)
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as BinInfo;
        })
        .then((data) => {
          if (!cancelled) setInfo(data?.bin ? data : null);
        })
        .catch(() => {
          if (!cancelled) setInfo(null);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cardNumber, endpoint]);

  return info;
}

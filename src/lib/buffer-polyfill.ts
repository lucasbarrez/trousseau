"use client";

import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  const g = globalThis as unknown as { Buffer?: typeof Buffer };
  if (!g.Buffer) g.Buffer = Buffer;
}

export {};

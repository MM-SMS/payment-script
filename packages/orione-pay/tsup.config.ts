import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
    "next/index": "src/next/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom", "react/jsx-runtime", "next", "stripe"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  onSuccess() {
    copyFileSync("src/styles/checkout.css", "dist/styles.css");
    for (const file of ["dist/react/index.js", "dist/react/index.cjs"]) {
      const source = readFileSync(file, "utf8");
      if (!source.startsWith('"use client"') && !source.startsWith("'use client'")) {
        writeFileSync(file, `"use client";\n${source}`);
      }
    }
  },
});

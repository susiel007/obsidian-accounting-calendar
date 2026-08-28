import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import autoPreprocess from "svelte-preprocess";
import { env } from "process";

export default {
  input: "src/main.ts",
  output: {
    format: "cjs",
    file: "main.js",
    exports: "default",
  },
  external: ["obsidian", "fs", "os", "path"],
  plugins: [
    svelte({
      emitCss: false,
      preprocess: autoPreprocess({
        typescript: {
          compilerOptions: {
            verbatimModuleSyntax: true,
          },
        },
      }),
    }),
    typescript({ sourceMap: env.env === "DEV", noEmitOnError: false }),
    resolve({
      browser: true,
      dedupe: ["svelte", "obsidian-daily-notes-interface"],
      extensions: [".mjs", ".js", ".ts", ".svelte", ".json"],
      rootDir: ".",
    }),
    commonjs({
      include: [/node_modules/],
    }),
  ],
};

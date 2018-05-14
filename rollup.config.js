import typescript from "rollup-plugin-typescript2";
import minify from "rollup-plugin-babel-minify";

export default [
  {
    input: "src/litjsx.ts",
    output: [
      {
        file: "dist/litjsx.esm.mjs",
        format: "es",
        sourcemap: true
      },
      {
        name: "litjsx",
        file: "dist/litjsx.umd.js",
        format: "umd",
        sourcemap: true
      }
    ],
    plugins: [typescript()]
  },
  {
    input: "src/litjsx.ts",
    output: {
      name: "litjsx",
      file: "dist/litjsx.min.js",
      format: "umd",
      sourcemap: true
    },
    plugins: [typescript(), minify()]
  }
];

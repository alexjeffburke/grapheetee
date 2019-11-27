import commonjs from "rollup-plugin-commonjs";

export default [
  {
    input: "lib/bundle/node.js",
    output: [
      {
        file: "node.js",
        format: "cjs",
        sourcemap: true
      }
    ],
    plugins: [commonjs()]
  }
];

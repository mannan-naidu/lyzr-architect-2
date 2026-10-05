import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memori ships a native (Rust/NAPI) engine and loads an ONNX model; pg has optional native
  // bindings. Keep them out of the server bundle and require them at runtime.
  serverExternalPackages: ["@memorilabs/memori", "pg"],
  // Memori ships its native engine for 8 platforms (~235 MB), which would push a Vercel function
  // past the 250 MB limit. Vercel runs linux-x64 (glibc): trace only that binary.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@memorilabs/memori/dist/native/memori_node.android-*",
      "node_modules/@memorilabs/memori/dist/native/memori_node.darwin-*",
      "node_modules/@memorilabs/memori/dist/native/memori_node.win32-*",
      "node_modules/@memorilabs/memori/dist/native/memori_node.linux-arm64-*",
      "node_modules/@memorilabs/memori/dist/native/memori_node.linux-x64-musl.node",
      ".fastembed_cache/**",
    ],
  },
};

export default nextConfig;

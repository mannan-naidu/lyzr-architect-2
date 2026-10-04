import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memori ships a native (Rust/NAPI) engine and loads an ONNX model; pg has optional native
  // bindings. Keep them out of the server bundle and require them at runtime.
  serverExternalPackages: ["@memorilabs/memori", "pg"],
};

export default nextConfig;

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CODELAB – Interactive Coding Academy",
    short_name: "CODELAB",
    description:
      "Nền tảng học lập trình C++ (<bits/stdc++.h> + Clang WASM), HTML, CSS, JavaScript tương tác kèm Gia sư AI thông minh.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#090e1a",
    theme_color: "#2563eb",
    lang: "vi",
    categories: ["education", "developer tools"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

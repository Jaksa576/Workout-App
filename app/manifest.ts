import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adaptive Training",
    short_name: "Adaptive",
    description: "Structured plans that progress with you.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4efe7",
    theme_color: "#0e1219",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192-v2.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512-v2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-maskable-v2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    categories: ["health", "fitness", "lifestyle"]
  };
}

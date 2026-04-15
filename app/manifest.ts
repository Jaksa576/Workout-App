import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adaptive Training",
    short_name: "Adaptive Training",
    description: "Structured plans that progress with you.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf9",
    theme_color: "#ff6a3d",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}

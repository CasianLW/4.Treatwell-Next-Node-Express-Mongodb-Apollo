// /** @type {import('next').NextConfig} */
// const { i18n } = require("./next-i18next.config");
// import { i18n } from "./next-i18next.config";

const nextConfig = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr", "es"],
  },
  images: {
    domains: ["images.unsplash.com"], // Add the Unsplash hostname here
  },
};

export default nextConfig;

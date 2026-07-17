import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NavigationProgress from "@/components/public/NavigationProgress";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://easternnewsnetwork.com"),
  title: {
    default: "Eastern News Network",
    template: "%s | Eastern News Network",
  },
  description: "Independent news from the East — politics, economy, society, and culture.",
  openGraph: {
    siteName: "Eastern News Network",
    type: "website",
    locale: "en_IN",
    url: "https://easternnewsnetwork.com",
    title: "Eastern News Network",
    description: "Independent news from the East — politics, economy, society, and culture.",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Eastern News Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@EasternNewsNet",
    title: "Eastern News Network",
    description: "Independent news from the East — politics, economy, society, and culture.",
    images: ["/android-chrome-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png" },
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: "Eastern News Network",
  url: "https://easternnewsnetwork.com",
  logo: {
    "@type": "ImageObject",
    url: "https://easternnewsnetwork.com/android-chrome-512x512.png",
  },
  description:
    "Independent news from the East — politics, economy, society, and culture.",
  foundingLocation: "India",
  sameAs: ["https://twitter.com/EasternNewsNet"],
  ethicsPolicy: "https://easternnewsnetwork.com/editorial-policy",
  correctionsPolicy: "https://easternnewsnetwork.com/editorial-policy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-stone-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100 flex flex-col min-h-screen overflow-x-hidden w-full`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>
          <NavigationProgress />
          {children}
        </Providers>
      </body>
    </html>
  );
}

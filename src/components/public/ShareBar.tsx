"use client";

import { useEffect, useState } from "react";

interface Props {
  title: string;
  articleId: string;
  compact?: boolean;
}

/* ── Icons ─────────────────────────────────────────────────────── */

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378L.057 24l1.684-6.162a9.866 9.866 0 01-1.322-4.957C.42 6.449 5.648 1.22 12.077 1.22a9.818 9.818 0 016.987 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.882 9.884" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────────── */

export default function ShareBar({ title, articleId, compact = false }: Props) {
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  function trackShare(platform: string) {
    try {
      const blob = new Blob([JSON.stringify({ platform })], { type: "application/json" });
      navigator.sendBeacon(`/api/articles/${articleId}/share`, blob);
    } catch {
      // tracking should never block the actual share
    }
  }

  async function copyLink() {
    trackShare("Copy link");
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  async function shareInstagram() {
    trackShare("Instagram");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: pageUrl });
      } catch {
        // user cancelled
      }
    } else {
      await copyLink();
    }
  }

  const enc = (s: string) => encodeURIComponent(s);

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(title + " — " + pageUrl)}`,
      icon: <WhatsAppIcon />,
      hover: "hover:text-[#25D366] hover:border-[#25D366]",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(pageUrl)}`,
      icon: <FacebookIcon />,
      hover: "hover:text-[#1877F2] hover:border-[#1877F2]",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${enc(pageUrl)}&text=${enc(title)}`,
      icon: <XIcon />,
      hover: "hover:text-gray-950 dark:hover:text-gray-100 hover:border-gray-950 dark:hover:border-gray-300",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(pageUrl)}`,
      icon: <LinkedInIcon />,
      hover: "hover:text-[#0A66C2] hover:border-[#0A66C2]",
    },
    {
      label: "Email",
      href: `mailto:?subject=${enc(title)}&body=${enc(pageUrl)}`,
      icon: <EmailIcon />,
      hover: "hover:text-brand-red hover:border-brand-red",
      sameTab: true,
    },
  ];

  const base =
    "inline-flex items-center gap-1.5 border border-gray-200 dark:border-white/15 rounded-sm px-3 py-2 sm:py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 transition-colors duration-150";

  if (compact) {
    const iconBase =
      "inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 transition-colors duration-150";

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {shareLinks.map((btn) => (
          <a
            key={btn.label}
            href={btn.href}
            target={btn.sameTab ? "_self" : "_blank"}
            rel="noopener noreferrer"
            title={btn.label}
            aria-label={`Share on ${btn.label}`}
            onClick={() => trackShare(btn.label)}
            className={`${iconBase} ${btn.hover}`}
          >
            {btn.icon}
          </a>
        ))}

        <button
          onClick={shareInstagram}
          title="Instagram"
          aria-label="Share on Instagram"
          className={`${iconBase} hover:text-[#E1306C] hover:border-[#E1306C]`}
        >
          <InstagramIcon />
        </button>

        <button
          onClick={copyLink}
          title={copied ? "Copied!" : "Copy link"}
          aria-label="Copy link"
          className={`${iconBase} ${
            copied
              ? "border-emerald-400 text-emerald-600 dark:text-emerald-400"
              : "hover:text-gray-950 dark:hover:text-gray-100 hover:border-gray-400"
          }`}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
      </div>
    );
  }

  return (
    <section className="border-t border-gray-200 dark:border-white/10 pt-8 mb-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-4">
        Share this story
      </p>
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((btn) => (
          <a
            key={btn.label}
            href={btn.href}
            target={btn.sameTab ? "_self" : "_blank"}
            rel="noopener noreferrer"
            onClick={() => trackShare(btn.label)}
            className={`${base} ${btn.hover}`}
          >
            {btn.icon}
            {btn.label}
          </a>
        ))}

        {/* Instagram — uses native share sheet; copies link on desktop */}
        <button
          onClick={shareInstagram}
          className={`${base} hover:text-[#E1306C] hover:border-[#E1306C]`}
        >
          <InstagramIcon />
          Instagram
        </button>

        {/* Copy link */}
        <button
          onClick={copyLink}
          className={`${base} ${
            copied
              ? "border-emerald-400 text-emerald-600 dark:text-emerald-400"
              : "hover:text-gray-950 dark:hover:text-gray-100 hover:border-gray-400"
          }`}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </section>
  );
}

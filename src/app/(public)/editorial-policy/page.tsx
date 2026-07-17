import type { Metadata } from "next";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "Eastern News Network's editorial standards, ownership and funding transparency, and corrections policy.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-4">{title}</p>
      <div className="w-6 h-0.5 bg-brand-red mb-6" />
      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-brand-red prose-strong:font-normal">
        {children}
      </div>
    </div>
  );
}

export default function EditorialPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16">
          <h1 className="text-2xl font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-5">
            Editorial Policy
          </h1>
          <div className="w-10 h-0.5 bg-brand-red mb-10" />

          <Section title="Editorial Standards">
            <p>
              Eastern News Network reports independently, without instruction from any political
              party, government body, or commercial interest. Every story published under our
              byline is reviewed by an editor before it goes live. We aim to verify facts with
              primary sources or named officials wherever possible, and we distinguish clearly
              between reporting and opinion.
            </p>
          </Section>

          <Section title="Ownership &amp; Funding">
            <p>
              Eastern News Network is an independently owned and operated publication. We do not
              accept funding from political parties or entities whose involvement could compromise
              the independence or quality of our coverage. Revenue comes from advertising and
              reader support.
            </p>
          </Section>

          <Section title="Corrections Policy">
            <p>
              We correct factual errors promptly once verified. If a published article requires a
              correction, we update the article and note the correction along with the date it was
              made. Significant corrections are noted at the top of the piece; minor corrections
              (spelling, formatting) may be made without a separate notice.
            </p>
            <p>
              To report an error or request a correction, contact our editorial desk at{" "}
              <a href="mailto:journo41@gmail.com">journo41@gmail.com</a> with the article URL and a
              description of the issue. We aim to respond within 48 hours.
            </p>
          </Section>

          <Section title="Content &amp; Authorship">
            <p>
              All articles are written and edited by our reporting and editorial staff. Author
              bylines link to a profile listing that writer&apos;s published work. Eastern News
              Network does not use AI tools to generate article content.
            </p>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

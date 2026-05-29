import type { Metadata } from "next";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";

export const metadata: Metadata = {
  title: "About — Eastern News Network",
  description:
    "Eastern News Network is an independent news publication catering to a diverse palette of news stories and features from the East as also the World.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16">

          {/* Page heading */}
          <h1 className="text-2xl font-black uppercase tracking-[0.18em] text-gray-400 mb-5">
            About
          </h1>
          <div className="w-10 h-0.5 bg-brand-red mb-8" />

          {/* Opening statement — deck style, matching article subtitles */}
          <p className="font-serif text-xl sm:text-2xl text-gray-700 leading-relaxed mb-4">
            Eastern News Network is an independent news publication catering to a diverse palette
            of news stories and features from the East as also the World.
          </p>
          <p className="font-serif text-lg text-gray-500 leading-relaxed mb-3">
            Embedded in communities across the region, delivering ground-level reporting that
            national outlets often miss.
          </p>
          <p className="font-serif text-base italic text-gray-400 mb-14">
            The reportage endeavours to deliver stuff where the light is seldom shed.
          </p>

          {/* Background section */}
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-4">
            Background
          </p>
          <div className="w-6 h-0.5 bg-brand-red mb-8" />

          {/* Narrative — uses the same prose class as ArticleBody */}
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-a:text-brand-red mb-14">
            <p>
              I remember the exact moment the idea first took hold — sitting in a dimly lit room,
              scrolling through headlines that felt distant, disconnected.
            </p>
            <p>I thought: what if someone built something different? What if that someone was me?</p>
            <p>
              It started as a sketch on paper. A name. A vision. A stubborn belief that stories
              deserved better telling and readers deserved better truth. I had no investors, no
              newsroom, no guarantee that any of it would work. What I had was a dream sharp enough
              to cut through every moment of self-doubt.
            </p>
            <p>
              I never told many people about the dream. It felt too fragile to speak aloud — this
              quiet, persistent vision of building something that mattered. A news platform rooted in
              honesty, in proximity, in the stories that deserved to be told. I called it, in my head
              long before it had a home on the internet, Eastern News Network.
            </p>
            <p>
              The nights were long. Building, rebuilding, questioning everything. There were weeks
              when the whole thing felt like sandcastles — beautiful in imagination, fragile in
              reality. People asked, kindly and not so kindly, why bother? The internet already had
              news. The world already had noise.
            </p>
            <p>
              I doubted myself. I wondered if dreaming this big was simply another word for
              foolishness.
            </p>
            <p>
              <strong>But a dream doesn&apos;t respond to logic. It only responds to action.</strong>
            </p>
            <p>
              I kept going. Because Eastern News Network wasn&apos;t just a website to me — it was a
              promise. To the part of me that believed one person, with enough conviction, could build
              something real.
            </p>
            <p>
              One who fought shoulder to shoulder with me is a young, energetic &amp; talented IT
              &amp; AI wizard. Meet <strong>Soumyajit Datta</strong> who made it happen almost at the
              blink of an eye. My &lsquo;Kurnish&rsquo; to Datta.
            </p>
            <p>And then came the morning everything changed.</p>
            <p>
              The website loaded. The logo appeared — Eastern News Network, right there on the
              screen, exactly as I had imagined it. The first story went live. The first reader
              arrived, then another. The thing I had imagined in that dim room, the thing I had
              whispered to myself in moments of doubt, was suddenly real — breathing and blinking on
              screens across the world. The beautiful, overwhelming stillness of arrival.
            </p>
            <p>
              <strong>Eastern News Network has gone on air.</strong>
            </p>
            <p>There is a particular kind of joy that comes not from applause, but from arrival.</p>
            <p>
              <em>Congratulations on bringing ENN to life.</em>
            </p>
          </div>

          {/* Statutory caution — same card style as "About the Author" on article pages */}
          <div className="rounded-sm border border-gray-200 bg-gray-50 px-6 py-5 mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">
              Statutory Caution
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We do not accept funding from political parties or blurred entities that could
              compromise the quality of our coverage.
            </p>
          </div>

          {/* Editor contact */}
          <div>
            <p className="font-serif text-2xl font-bold text-gray-950 mb-1">Prasanta Paul</p>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-red mb-4">
              Editor, India
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                <a
                  href="mailto:journo41@gmail.com"
                  className="hover:text-brand-red transition-colors"
                >
                  journo41@gmail.com
                </a>
              </p>
              <p>
                <a href="tel:+919433005558" className="hover:text-brand-red transition-colors">
                  +91 94330 05558
                </a>
              </p>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}

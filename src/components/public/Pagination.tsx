import Link from "next/link";

interface Props {
  page: number;
  totalPages: number;
  basePath: string;
}

function ChevronLeft() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Pagination({ page, totalPages, basePath }: Props) {
  const prevHref = page > 1 ? `${basePath}?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `${basePath}?page=${page + 1}` : null;

  const btnBase =
    "inline-flex items-center gap-1.5 border rounded-sm px-4 py-2.5 sm:py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors";
  const btnActive =
    "border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:border-brand-red hover:text-brand-red";
  const btnDisabled =
    "border-gray-100 dark:border-white/5 text-gray-300 dark:text-gray-700 cursor-not-allowed select-none";

  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
      {prevHref ? (
        <Link href={prevHref} className={`${btnBase} ${btnActive}`}>
          <ChevronLeft />
          Previous
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`}>
          <ChevronLeft />
          Previous
        </span>
      )}

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        Page {page} of {totalPages}
      </p>

      {nextHref ? (
        <Link href={nextHref} className={`${btnBase} ${btnActive}`}>
          Next
          <ChevronRight />
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`}>
          Next
          <ChevronRight />
        </span>
      )}
    </div>
  );
}

interface Props {
  label: string;
  value: number | string;
}

export default function MetricsStatCard({ label, value }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-transparent dark:border-white/10 rounded-lg shadow-sm p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold font-serif">{value}</p>
    </div>
  );
}

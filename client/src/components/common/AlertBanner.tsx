/**
 * AlertBanner.tsx — Inline error/info banner for page-level API failures.
 */
interface AlertBannerProps {
  message: string;
  variant?: 'error' | 'warning' | 'info';
}

const styles = {
  error:   'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  info:    'bg-blue-50 border-blue-300 text-blue-800',
};

export function AlertBanner({ message, variant = 'error' }: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

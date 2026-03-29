export function AISparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        className="fill-cyan-400"
      />
      <circle cx="18" cy="6" r="1.5" className="fill-cyan-300 motion-safe:animate-pulse" />
      <circle cx="6" cy="18" r="1" className="fill-blue-400 motion-safe:animate-pulse [animation-delay:75ms]" />
      <circle cx="19" cy="17" r="1" className="fill-violet-400 motion-safe:animate-pulse [animation-delay:150ms]" />
    </svg>
  );
}

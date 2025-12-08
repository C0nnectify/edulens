
import {
  BrainCircuit,
  PercentCircle,
  Timer,
  Zap,
  Star
} from 'lucide-react';

const stats = [
  {
    label: "AI Tools",
    value: "13",
    colorClass: "text-emerald-600",
    iconBg: "bg-emerald-50",
    iconShadow: "shadow-[0_4px_24px_0_rgba(16,185,129,0.10)]",
    icon: BrainCircuit
  },
  {
    label: "Accuracy",
    value: "99%",
    colorClass: "text-blue-600",
    iconBg: "bg-blue-50",
    iconShadow: "shadow-[0_4px_24px_0_rgba(37,99,235,0.10)]",
    icon: PercentCircle
  },
  {
    label: "Available",
    value: "24/7",
    colorClass: "text-purple-600",
    iconBg: "bg-purple-50",
    iconShadow: "shadow-[0_4px_24px_0_rgba(139,92,246,0.10)]",
    icon: Timer
  },
  {
    label: "Faster",
    value: "10x",
    colorClass: "text-orange-600",
    iconBg: "bg-orange-50",
    iconShadow: "shadow-[0_4px_24px_0_rgba(251,146,60,0.09)]",
    icon: Zap
  },
  {
    label: "Trial",
    value: "Free",
    colorClass: "text-green-600",
    iconBg: "bg-green-50",
    iconShadow: "shadow-[0_4px_24px_0_rgba(34,197,94,0.10)]",
    icon: Star
  }
];

// Enhanced, interactive stats area
const AIToolsStats = () => (
  <div className="mb-8">
    <div
      className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent px-1 md:grid md:grid-cols-5 md:gap-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
      aria-label="AI Toolkit quick stats"
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            tabIndex={0}
            role="region"
            aria-label={stat.label}
            className={`
              relative flex-shrink-0 w-[80vw] max-w-[220px] sm:max-w-[220px] md:w-auto md:max-w-none group
              border border-gray-100 md:border-0 
              bg-white md:bg-transparent
              rounded-2xl md:rounded-none shadow-sm md:shadow-none
              md:flex-col md:items-center md:justify-center
              transition-all duration-200
              overflow-hidden
              before:absolute before:-z-10 before:inset-0 before:bg-gradient-to-t before:from-emerald-50/70 before:to-transparent before:opacity-0 group-hover:before:opacity-100 group-focus-visible:before:opacity-100
              focus-visible:outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
              hover:shadow-xl hover:scale-[1.045] hover:bg-gradient-to-br hover:from-blue-50/60 hover:to-emerald-50/90
              focus-visible:shadow-emerald-200 focus-within:shadow-xl
              active:scale-[0.98]
              cursor-pointer
              animate-fade-in
            `}
          >
            <div className="flex items-center md:justify-center gap-3 md:flex-col md:gap-0 px-4 py-3 md:p-0">
              <div
                className={`
                  flex items-center justify-center ${stat.iconBg} ${stat.iconShadow}
                  rounded-full w-14 h-14 md:mx-auto mb-0 md:mb-2
                  ring-1 ring-inset ring-white/40
                  transition group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-blue-200
                  duration-200
                `}
                style={{
                  boxShadow: idx % 2 === 0
                    ? '0 4px 24px 0 rgba(16,185,129,0.10)'
                    : ''
                }}
              >
                {/* Add a background gradient vignette for "pop" on interaction */}
                <span className={`
                  absolute w-16 h-16 rounded-full opacity-0 pointer-events-none 
                  bg-gradient-to-tr from-emerald-100/80 via-blue-100/70 to-transparent 
                  blur-2xl
                  transition group-hover:opacity-60 group-focus-visible:opacity-60`} 
                ></span>
                <Icon
                  className={`h-8 w-8 ${stat.colorClass} drop-shadow-sm transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110 group-active:scale-95`}
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col justify-center md:items-center ml-3 md:ml-0">
                <span
                  className={`
                    text-2xl md:text-3xl font-extrabold ${stat.colorClass} font-display tracking-tight
                    transition group-hover:opacity-90 group-hover:shadow-sm
                    drop-shadow-sm
                  `}
                  style={{
                    textShadow: "0 2px 8px rgba(16,185,129,0.10)"
                  }}
                >
                  {stat.value}
                </span>
                <span className="text-gray-600 text-sm md:text-base mt-1 font-medium">
                  {stat.label}
                </span>
              </div>
            </div>
            {/* Separator between stats on desktop only */}
            {idx < stats.length - 1 && (
              <span
                className="hidden md:block absolute top-1/4 right-0 h-2/4 w-px bg-gradient-to-b from-emerald-200 via-blue-100 to-transparent"
                aria-hidden="true"
              />
            )}
            {/* Pop visual animated vignette glow on active/focus */}
            <span
              className={`
                absolute inset-0 pointer-events-none rounded-2xl ring-emerald-200/40
                ring-0 ring-offset-4 transition-all duration-200
                group-focus-visible:ring-2 group-focus-visible:ring-blue-400 group-hover:ring-2 group-hover:ring-emerald-200/80
                group-active:ring-2 group-active:ring-blue-200
                opacity-0 group-focus-visible:opacity-100 group-hover:opacity-90
              `}
              aria-hidden="true"
            ></span>
          </div>
        );
      })}
    </div>
  </div>
);

export default AIToolsStats;

import { Dumbbell } from "lucide-react";

export default function Logo({ size = "md" }) {
  const big = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex items-center justify-center rounded-xl bg-primary/15 text-primary shadow-neon-pink ${
          big ? "w-14 h-14" : "w-10 h-10"
        }`}
      >
        <Dumbbell size={big ? 30 : 22} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className={`neon-sign font-bold ${big ? "text-2xl" : "text-lg"}`}>
        <span className="neon-pink neon-flicker">Hyper</span>
        <span className="neon-purple neon-flicker-slow">Track</span>
      </span>
    </div>
  );
}

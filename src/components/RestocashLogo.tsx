import { UtensilsCrossed, CircleDollarSign } from "lucide-react";
import React from "react";

export function RestocashLogo({
  className = "",
  size = 24,
  variant = "default",
  showDeveloper = true,
}: {
  className?: string;
  size?: number;
  variant?: "default" | "white";
  showDeveloper?: boolean;
}) {
  const isWhite = variant === "white";
  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`flex items-center gap-2 font-black tracking-tight`}>
        <div
          className={`relative flex items-center justify-center ${isWhite ? "text-white" : "text-primary"}`}
        >
          <UtensilsCrossed size={size} strokeWidth={2.5} />
          <div
            className={`absolute -bottom-1 -right-1 rounded-full p-0.5 ${isWhite ? "bg-white/20 backdrop-blur" : "bg-background"}`}
          >
            <CircleDollarSign
              size={size * 0.6}
              className={isWhite ? "text-white" : "text-emerald-500"}
              strokeWidth={3}
            />
          </div>
        </div>
        <span
          className={
            isWhite
              ? "text-white"
              : "bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent"
          }
          style={{ fontSize: size }}
        >
          Resto<span className={isWhite ? "text-white/80" : "text-emerald-500"}>cash</span>
        </span>
      </div>
      {showDeveloper && (
        <span
          className={`text-[0.45em] font-medium opacity-80 tracking-wide block mt-0.5 ${isWhite ? "text-white/70" : "text-slate-500"}`}
          style={{ fontSize: size * 0.4 }}
        >
          developed by Lion creativity M.H
        </span>
      )}
    </div>
  );
}

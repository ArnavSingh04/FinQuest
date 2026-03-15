"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, RotateCcw, LogOut } from "lucide-react";

import { useGameStore } from "@/store/useGameStore";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/auth";

function pollutionFromWeather(weather: string): number {
  const map: Record<string, number> = {
    destruction: 90,
    storm: 70,
    rain: 50,
    overcast: 30,
    clear: 10,
    thriving: 0,
  };
  return map[weather] ?? 30;
}

export function TopHUD() {
  const cityName = useGameStore((s) => s.cityName);
  const setCityName = useGameStore((s) => s.setCityName);
  const clearAll = useGameStore((s) => s.clearAll);
  const cityState = useGameStore((s) => s.cityState);
  const { user } = useAuth();
  const healthScore = cityState.healthScore;
  const economy = healthScore;
  const pollution = pollutionFromWeather(cityState.weather);
  const growth = Math.min(100, cityState.population * 10);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editCityName, setEditCityName] = useState(false);
  const [cityNameInput, setCityNameInput] = useState(cityName);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCityNameInput(cityName);
  }, [cityName]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [dropdownOpen]);

  function handleConfirmCityName() {
    const trimmed = cityNameInput.trim();
    if (trimmed) setCityName(trimmed);
    setEditCityName(false);
  }

  function handleResetCity() {
    setShowResetConfirm(false);
    setDropdownOpen(false);
    clearAll();
  }

  async function handleLogOut() {
    setDropdownOpen(false);
    await signOutUser();
  }

  const userDisplay = user?.email ?? user?.user_metadata?.full_name ?? "Signed in";

  return (
    <>
      <header
        className="absolute left-0 right-0 top-0 z-20 flex flex-col pt-[env(safe-area-inset-top)]"
        style={{ maxWidth: 390, margin: "0 auto", backgroundColor: "#1C3A2E" }}
      >
        <div className="flex h-[52px] items-center justify-between px-4 backdrop-blur-md">
          <span className="font-heading text-lg font-normal" style={{ color: "#F2EDE3" }}>
            FinCity
          </span>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <span className="text-sm font-medium" style={{ color: "#F2EDE3" }}>
              {cityName} · {healthScore}
            </span>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  healthScore >= 70
                    ? "var(--cat-invest)"
                    : healthScore >= 40
                      ? "var(--cat-want)"
                      : "var(--cat-treat)",
              }}
              aria-hidden
            />
          </div>
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: "#C17B3F",
                color: "#F2EDE3",
                ...(dropdownOpen ? { outline: "2px solid #C17B3F", outlineOffset: 2 } : {}),
              }}
              aria-label="Profile"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {cityName[0]?.toUpperCase() ?? "?"}
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 z-50 py-2"
                style={{
                  top: "100%",
                  marginTop: 8,
                  width: 200,
                  background: "#FFFFFF",
                  border: "1px solid #C8BFA8",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(28,58,46,0.12)",
                  fontFamily: "var(--font-body), DM Sans, sans-serif",
                }}
              >
                {/* User info row */}
                <div
                  className="px-4 pt-3 pb-2"
                  style={{
                    fontSize: 12,
                    color: "#8A9E94",
                    borderBottom: "1px solid #C8BFA8",
                  }}
                >
                  {userDisplay}
                </div>

                {editCityName ? (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <input
                      type="text"
                      value={cityNameInput}
                      onChange={(e) => setCityNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmCityName();
                        if (e.key === "Escape") {
                          setCityNameInput(cityName);
                          setEditCityName(false);
                        }
                      }}
                      className="flex-1 rounded-lg border px-2 py-1.5 text-sm outline-none"
                      style={{ borderColor: "#C8BFA8", color: "#1C3A2E" }}
                      autoFocus
                      aria-label="City name"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmCityName}
                      className="rounded px-2 py-1 text-sm font-medium"
                      style={{ backgroundColor: "#C17B3F", color: "#FFFFFF" }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditCityName(true)}
                    className="flex w-full cursor-pointer items-center px-4 py-2.5 transition-colors rounded-lg hover:bg-[#E8E0D0] mx-2"
                    style={{ color: "#1C3A2E" }}
                  >
                    <Pencil size={16} style={{ marginRight: 10, flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>Edit City Name</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex w-full cursor-pointer items-center rounded-lg px-4 py-2.5 transition-colors hover:bg-[#E8E0D0] mx-2"
                  style={{ color: "#D94F3D" }}
                >
                  <RotateCcw size={16} style={{ marginRight: 10, flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>Reset City</span>
                </button>

                <div style={{ height: 1, background: "#C8BFA8", margin: "4px 0" }} />

                <button
                  type="button"
                  onClick={handleLogOut}
                  className="flex w-full cursor-pointer items-center rounded-lg px-4 py-2.5 transition-colors hover:bg-[#E8E0D0] mx-2"
                  style={{ color: "#1C3A2E" }}
                >
                  <LogOut size={16} style={{ marginRight: 10, flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 flex justify-center gap-2 px-4">
          <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(28, 58, 46, 0.88)", color: "#F2EDE3" }}>
            Economy {economy}
          </span>
          <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(28, 58, 46, 0.88)", color: "#F2EDE3" }}>
            Pollution {pollution}
          </span>
          <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(28, 58, 46, 0.88)", color: "#F2EDE3" }}>
            Growth {growth}
          </span>
        </div>
      </header>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          role="dialog"
          aria-modal
          aria-labelledby="reset-dialog-title"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="max-w-sm rounded-2xl p-5"
            style={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(28,58,46,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reset-dialog-title" className="font-heading text-lg font-normal" style={{ color: "#1C3A2E" }}>
              Reset City?
            </h3>
            <p className="mt-2 text-sm" style={{ color: "#4A6358" }}>
              This will clear all transactions and reset your city. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-full py-2.5 text-sm font-semibold"
                style={{ border: "1px solid #1C3A2E", color: "#1C3A2E", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetCity}
                className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white"
                style={{ background: "#D94F3D" }}
              >
                Reset City
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import type { RewardBuildingType } from "@/types";
import { REWARD_TOWER_POSITIONS, REWARD_PARK_POSITIONS } from "@/lib/rewardPositions";

export function RewardChoiceModal() {
  const questId            = useGameStore((s) => s.pendingRewardQuestId);
  const questTitle         = useGameStore((s) => s.pendingRewardQuestTitle);
  const rewardBuildings    = useGameStore((s) => s.rewardBuildings);
  const chooseReward       = useGameStore((s) => s.chooseReward);
  const dismissPendingReward = useGameStore((s) => s.dismissPendingReward);

  const [selected, setSelected] = useState<RewardBuildingType | null>(null);
  const [visible, setVisible]   = useState(false);
  const [cityFull, setCityFull]  = useState(false);

  // Slide in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => dismissPendingReward(), 320);
  }

  function handleConfirm() {
    if (!selected) return;

    const usedTowerPositions = rewardBuildings
      .filter((b) => b.type === "gold_tower" && b.position)
      .map((b) => `${b.position!.x},${b.position!.z}`);

    const usedParkPositions = rewardBuildings
      .filter((b) => b.type === "park" && b.position)
      .map((b) => `${b.position!.x},${b.position!.z}`);

    let position: { x: number; z: number };
    let heightMultiplier: number | undefined;
    let parkSize: "small" | "large" | undefined;

    if (selected === "gold_tower") {
      const slot = REWARD_TOWER_POSITIONS.find(
        (p) => !usedTowerPositions.includes(`${p.x},${p.z}`)
      );
      if (!slot) {
        setCityFull(true);
        return;
      }
      position = { x: slot.x, z: slot.z };
      heightMultiplier = slot.heightMultiplier;
    } else {
      const existingParks = rewardBuildings.filter((b) => b.type === "park");
      const slot = REWARD_PARK_POSITIONS.find(
        (p) => !usedParkPositions.includes(`${p.x},${p.z}`)
      );
      if (!slot) {
        setCityFull(true);
        return;
      }
      position = { x: slot.x, z: slot.z };
      parkSize = existingParks.length < 3 ? "small" : "large";
    }

    setVisible(false);
    setTimeout(() => {
      chooseReward(selected, position, heightMultiplier, parkSize);
    }, 320);
  }

  // ── Shared card styles ────────────────────────────────────────────────────────
  const cardBase: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: "20px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  };

  const towerSelected = selected === "gold_tower";
  const parkSelected  = selected === "park";

  const towerCardStyle: React.CSSProperties = {
    ...cardBase,
    background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    border: towerSelected ? "3px solid #C9A84C" : "2px solid #C9A84C",
    transform: towerSelected ? "scale(1.03)" : "scale(1)",
    boxShadow: towerSelected
      ? "0 0 20px rgba(201,168,76,0.4)"
      : "0 2px 8px rgba(201,168,76,0.15)",
  };

  const parkCardStyle: React.CSSProperties = {
    ...cardBase,
    background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
    border: parkSelected ? "3px solid #3DAB6A" : "2px solid #3DAB6A",
    transform: parkSelected ? "scale(1.03)" : "scale(1)",
    boxShadow: parkSelected
      ? "0 0 20px rgba(61,171,106,0.35)"
      : "0 2px 8px rgba(61,171,106,0.12)",
  };

  const confirmDisabled = !selected;
  const confirmStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    borderRadius: 999,
    border: "none",
    cursor: confirmDisabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    transition: "opacity 160ms ease",
    ...(confirmDisabled
      ? { background: "#E8E0D0", color: "#8A9E94" }
      : towerSelected
        ? { background: "#C9A84C", color: "#1C3A2E" }
        : { background: "#3DAB6A", color: "#FFFFFF" }),
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={handleDismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(28, 58, 46, 0.5)",
          backdropFilter: "blur(4px)",
          transition: "opacity 300ms ease",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* ── Sheet ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          display: "flex",
          justifyContent: "center",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#FFFFFF",
            borderRadius: "24px 24px 0 0",
            padding: "32px 24px 48px",
          }}
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E8E0D0" }} />
          </div>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                fontSize: 48,
                lineHeight: 1,
                marginBottom: 12,
                filter: "drop-shadow(0 0 12px rgba(201,168,76,0.6))",
              }}
            >
              🏆
            </div>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 28,
                color: "#1C3A2E",
                margin: 0,
                marginBottom: 6,
              }}
            >
              Quest Complete!
            </h2>
            {questTitle && (
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "#4A6358",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                &ldquo;{questTitle}&rdquo;
              </p>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E8E0D0", margin: "0 0 20px" }} />

          {/* ── Choice prompt ── */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#8A9E94",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 16px",
            }}
          >
            Choose your city reward:
          </p>

          {/* ── Choice cards ── */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {/* Gold Tower */}
            <button
              onClick={() => setSelected("gold_tower")}
              style={towerCardStyle}
              aria-pressed={towerSelected}
            >
              <span style={{ fontSize: 40, lineHeight: 1 }}>🏙️</span>
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20,
                  color: "#92400E",
                  lineHeight: 1.2,
                }}
              >
                Gold Tower
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#A16207",
                  lineHeight: 1.4,
                }}
              >
                Add a gleaming skyscraper to your Financial Crown district
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "#C9A84C",
                  color: "#7C2D12",
                  padding: "3px 8px",
                  borderRadius: 999,
                  marginTop: 4,
                }}
              >
                Investment Reward
              </span>
            </button>

            {/* Park */}
            <button
              onClick={() => setSelected("park")}
              style={parkCardStyle}
              aria-pressed={parkSelected}
            >
              <span style={{ fontSize: 40, lineHeight: 1 }}>🌳</span>
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20,
                  color: "#166534",
                  lineHeight: 1.2,
                }}
              >
                City Park
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#15803D",
                  lineHeight: 1.4,
                }}
              >
                Plant a peaceful green space that improves your city&rsquo;s health score
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "#3DAB6A",
                  color: "#FFFFFF",
                  padding: "3px 8px",
                  borderRadius: 999,
                  marginTop: 4,
                }}
              >
                Wellness Reward
              </span>
            </button>
          </div>

          {/* ── City-full message ── */}
          {cityFull ? (
            <div
              style={{
                padding: "14px 16px",
                background: "#FEF3C7",
                borderRadius: 12,
                border: "1px solid #C9A84C",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#92400E",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Your city is full of {towerSelected ? "towers" : "parks"}!
              Keep completing quests for future city expansions.
              <button
                onClick={() => setCityFull(false)}
                style={{
                  display: "block",
                  margin: "8px auto 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#C9A84C",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                ← Choose the other type
              </button>
            </div>
          ) : (
            /* ── Confirm button ── */
            <button
              onClick={handleConfirm}
              disabled={confirmDisabled}
              style={confirmStyle}
            >
              {!selected && "Select a reward above"}
              {towerSelected && "Place Gold Tower in My City →"}
              {parkSelected  && "Plant Park in My City →"}
            </button>
          )}

          {/* ── Dismiss link ── */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={handleDismiss}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#8A9E94",
                padding: 0,
              }}
            >
              Skip for now
            </button>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: "#C8BFA8",
                margin: "4px 0 0",
              }}
            >
              You can claim this reward later from Quests
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect } from "react";

/** Injects apple-mobile-web-app meta tags for PWA (status bar dark text on light theme). */
export function MobileMeta() {
  useEffect(() => {
    const cap = document.createElement("meta");
    cap.setAttribute("name", "apple-mobile-web-app-capable");
    cap.setAttribute("content", "yes");
    const style = document.createElement("meta");
    style.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    style.setAttribute("content", "default");
    document.head.appendChild(cap);
    document.head.appendChild(style);
    return () => {
      cap.remove();
      style.remove();
    };
  }, []);
  return null;
}

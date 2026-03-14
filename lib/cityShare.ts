import type { CityState, Proportions } from "@/types";

export interface SharedCityPayload {
  name: string;         // city nickname
  props: Proportions;
  city: Omit<CityState, "budgetUsed">; // never share budget data
}

export function encodeCityShare(payload: SharedCityPayload): string {
  const json = JSON.stringify({
    n: payload.name,
    p: [
      Math.round(payload.props.needs * 1000),
      Math.round(payload.props.wants * 1000),
      Math.round(payload.props.treats * 1000),
      Math.round(payload.props.investments * 1000),
    ],
    c: [
      Math.round(payload.city.bankHeight * 10),
      payload.city.restaurantCount,
      payload.city.apartmentCount,
      Math.round(payload.city.towerHeight * 10),
      payload.city.healthScore,
      payload.city.population,
      payload.city.weather,
    ],
  });
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodeCityShare(code: string): SharedCityPayload | null {
  try {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = atob(padded + pad);
    const raw = JSON.parse(json) as {
      n: string;
      p: [number, number, number, number];
      c: [number, number, number, number, number, number, string];
    };
    return {
      name: raw.n ?? "Anonymous",
      props: {
        needs:       raw.p[0] / 1000,
        wants:       raw.p[1] / 1000,
        treats:      raw.p[2] / 1000,
        investments: raw.p[3] / 1000,
      },
      city: {
        bankHeight:      raw.c[0] / 10,
        restaurantCount: raw.c[1],
        apartmentCount:  raw.c[2],
        towerHeight:     raw.c[3] / 10,
        healthScore:     raw.c[4],
        population:      raw.c[5],
        weather:         raw.c[6] as CityState["weather"],
      },
    };
  } catch {
    return null;
  }
}
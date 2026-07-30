import type {
  Formation,
  GameModeInfo,
  LeagueMeta,
  Position,
  PositionFamily,
  RecordInfo,
  SimulateRequest,
  SimulateResponse,
  SquadResponse,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(`Could not reach the DraftChamp API at ${BASE_URL}`, 0);
  }

  if (!response.ok) {
    // FastAPI puts validation failures in `detail`; fall back to the status text.
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // response had no JSON body — keep the status text
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  league: () => request<LeagueMeta>("/api/league"),
  formations: () => request<Formation[]>("/api/formations"),
  positionFamilies: () => request<Record<Position, PositionFamily>>("/api/position-families"),
  modes: () => request<GameModeInfo[]>("/api/modes"),
  records: () => request<RecordInfo[]>("/api/records"),
  squad: (team: string, season: number) =>
    request<SquadResponse>(`/api/squad/${encodeURIComponent(team)}/${season}`),
  simulate: (body: SimulateRequest) =>
    request<SimulateResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

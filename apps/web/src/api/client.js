const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, init) {
  let response;
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

  return await response.json();
}

export const api = {
  league: () => request("/api/league"),
  formations: () => request("/api/formations"),
  positionFamilies: () => request("/api/position-families"),
  modes: () => request("/api/modes"),
  records: () => request("/api/records"),
  /** Omit `date` for today; pass YYYY-MM-DD to replay a day from the archive. */
  daily: (date) => request(date ? `/api/daily?date=${encodeURIComponent(date)}` : "/api/daily"),
  squad: (team, season) => request(`/api/squad/${encodeURIComponent(team)}/${season}`),
  simulate: (body) =>
    request("/api/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

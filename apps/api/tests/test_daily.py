from __future__ import annotations

import pytest

from app.engine.daily import SEQUENCE_LENGTH, build_daily, parse_date, today_utc
from app.engine.formations import FORMATIONS


@pytest.fixture
def formation_ids() -> list[str]:
    return list(FORMATIONS.keys())


class TestBuildDaily:
    def test_is_deterministic_for_a_date(self, league, formation_ids):
        a = build_daily("2026-08-03", league.combos, formation_ids)
        b = build_daily("2026-08-03", league.combos, formation_ids)
        assert a == b

    def test_different_dates_give_different_drafts(self, league, formation_ids):
        a = build_daily("2026-08-03", league.combos, formation_ids)
        b = build_daily("2026-08-04", league.combos, formation_ids)
        assert (a.formation_id, a.combos) != (b.formation_id, b.combos)

    def test_picks_a_real_formation(self, league, formation_ids):
        for day in range(1, 29):
            draft = build_daily(f"2026-08-{day:02d}", league.combos, formation_ids)
            assert draft.formation_id in FORMATIONS

    def test_sequence_only_contains_real_combos(self, league, formation_ids):
        draft = build_daily("2026-08-03", league.combos, formation_ids)
        available = {(c.team, c.season) for c in league.combos}
        assert len(draft.combos) == SEQUENCE_LENGTH
        assert all((c.team, c.season) in available for c in draft.combos)

    def test_sequence_never_repeats_back_to_back(self, league, formation_ids):
        # A reveal landing on the club-season you just saw reads as a bug.
        for day in range(1, 29):
            draft = build_daily(f"2026-08-{day:02d}", league.combos, formation_ids)
            pairs = zip(draft.combos, draft.combos[1:])
            assert all(a != b for a, b in pairs)

    def test_rejects_empty_inputs(self, league, formation_ids):
        with pytest.raises(ValueError):
            build_daily("2026-08-03", [], formation_ids)
        with pytest.raises(ValueError):
            build_daily("2026-08-03", league.combos, [])


class TestDates:
    def test_today_is_an_iso_date(self):
        assert len(today_utc()) == 10
        assert parse_date(today_utc()) == today_utc()

    def test_parse_date_rejects_nonsense(self):
        with pytest.raises(ValueError):
            parse_date("not-a-date")
        with pytest.raises(ValueError):
            parse_date("2026-13-01")


class TestDailyEndpoint:
    def test_returns_todays_draft(self, client):
        response = client.get("/api/daily")
        assert response.status_code == 200
        body = response.json()
        assert body["date"] == today_utc()
        assert body["formationId"] in FORMATIONS
        assert len(body["combos"]) == SEQUENCE_LENGTH

    def test_accepts_an_explicit_date(self, client):
        response = client.get("/api/daily", params={"date": "2026-08-03"})
        assert response.status_code == 200
        assert response.json()["date"] == "2026-08-03"

    def test_same_date_is_stable_across_calls(self, client):
        first = client.get("/api/daily", params={"date": "2026-08-03"}).json()
        second = client.get("/api/daily", params={"date": "2026-08-03"}).json()
        assert first == second

    def test_rejects_a_malformed_date(self, client):
        assert client.get("/api/daily", params={"date": "03-08-2026"}).status_code == 422

    def test_the_daily_formation_is_actually_draftable(self, client):
        """The sequence has to be able to fill the day's formation — a daily
        that can't be completed would be unplayable for everyone."""
        body = client.get("/api/daily").json()
        slots = FORMATIONS[body["formationId"]]
        needed = {s.fam for s in slots}

        seen_families: set[str] = set()
        for combo in body["combos"][:12]:
            squad = client.get(f"/api/squad/{combo['team']}/{combo['season']}").json()
            for player in squad["players"]:
                seen_families.update(
                    fam
                    for fam in ("GK", "DEF", "MID", "FWD")
                    if any(p in _FAMILY_POSITIONS[fam] for p in player["positions"])
                )
        assert needed <= seen_families


_FAMILY_POSITIONS = {
    "GK": {"GK"},
    "DEF": {"CB", "LB", "RB", "LWB", "RWB"},
    "MID": {"CDM", "CM", "CAM", "LM", "RM"},
    "FWD": {"LW", "RW", "ST", "CF"},
}

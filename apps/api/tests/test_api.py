"""API-level tests.

These lean on the server being authoritative: the client only ever says which
player it placed where, so every test that tampers with the request should be
rejected rather than silently simulated.
"""

from __future__ import annotations

import pytest

from app.engine.formations import FORMATIONS
from app.engine.modes import DEFAULT_BUDGET_CAP


def build_valid_xi(league, squad_of, formation_id="4-3-3"):
    """Fill a formation with eligible, distinct players from the fixture league."""
    from app.engine.formations import eligible_families

    all_players = [p for squad in league.squads.values() for p in squad]
    assignments = []
    used: set[int] = set()

    for slot in FORMATIONS[formation_id]:
        for player in all_players:
            if player.id in used:
                continue
            if slot.fam not in eligible_families(player):
                continue
            team, season = squad_of[player.id]
            assignments.append(
                {
                    "slotId": slot.id,
                    "playerId": player.id,
                    "team": team,
                    "season": season,
                }
            )
            used.add(player.id)
            break
        else:  # pragma: no cover - fixture is built to always satisfy this
            pytest.fail(f"fixture league has no eligible player for slot {slot.id}")

    return assignments


class TestMetadataEndpoints:
    def test_health(self, client):
        body = client.get("/api/health").json()
        assert body["status"] == "ok"

    def test_league_metadata_excludes_squads(self, client):
        response = client.get("/api/league")
        assert response.status_code == 200
        body = response.json()
        assert "squads" not in body
        assert body["teams"]
        assert body["combos"]
        assert "dataVersion" in body

    def test_formations_expose_coordinates_for_rendering(self, client):
        body = client.get("/api/formations").json()
        assert {f["id"] for f in body} == set(FORMATIONS)
        for formation in body:
            assert len(formation["slots"]) == 11
            for slot in formation["slots"]:
                assert 0 <= slot["x"] <= 100
                assert 0 <= slot["y"] <= 100

    def test_records_are_listed(self, client):
        body = client.get("/api/records").json()
        assert len(body) >= 4
        assert all("holder" in r and "value" in r for r in body)

    def test_modes_exclude_record_chase(self, client):
        ids = {m["id"] for m in client.get("/api/modes").json()}
        assert "record-chase" not in ids
        assert {"classic", "budget", "peak-xi", "duel"} <= ids

    def test_squad_lookup(self, client):
        body = client.get("/api/squad/TMA/2023").json()
        assert body["team"] == "TMA"
        assert body["players"]
        assert "shirtNumber" in body["players"][0]

    def test_unknown_squad_is_404(self, client):
        assert client.get("/api/squad/ZZZ/1900").status_code == 404


class TestSimulate:
    def test_valid_xi_returns_season_and_all_challenges(self, client, league, squad_of):
        slots = build_valid_xi(league, squad_of)
        response = client.post(
            "/api/simulate", json={"formationId": "4-3-3", "slots": slots, "mode": "classic"}
        )
        assert response.status_code == 200, response.text
        body = response.json()

        season = body["season"]
        assert season["wins"] + season["draws"] + season["losses"] == 38
        assert season["points"] == season["wins"] * 3 + season["draws"]

        records = client.get("/api/records").json()
        assert len(body["challenges"]) == len(records)
        assert body["challengesAchieved"] == sum(
            1 for c in body["challenges"] if c["achieved"]
        )

    def test_chemistry_is_included_and_internally_consistent(self, client, league, squad_of):
        slots = build_valid_xi(league, squad_of)
        response = client.post(
            "/api/simulate", json={"formationId": "4-3-3", "slots": slots, "mode": "classic"}
        )
        chemistry = response.json()["chemistry"]

        assert 0 <= chemistry["score"] <= 100
        total_linked_pairs = (
            chemistry["teammatePairs"] + chemistry["clubmatePairs"] + chemistry["countrymanPairs"]
        )
        assert total_linked_pairs <= 11 * 10 // 2
        assert len(chemistry["highlights"]) <= total_linked_pairs
        assert len(chemistry["highlights"]) <= 5
        for link in chemistry["highlights"]:
            assert link["kind"] in ("teammates", "clubmates", "countrymen")
            assert link["slotA"] != link["slotB"]

    def test_same_xi_gives_the_same_result(self, client, league, squad_of):
        payload = {
            "formationId": "4-3-3",
            "slots": build_valid_xi(league, squad_of),
            "mode": "classic",
        }
        first = client.post("/api/simulate", json=payload).json()
        second = client.post("/api/simulate", json=payload).json()
        assert first == second

    def test_incomplete_xi_is_rejected(self, client, league, squad_of):
        slots = build_valid_xi(league, squad_of)[:-1]
        response = client.post(
            "/api/simulate", json={"formationId": "4-3-3", "slots": slots}
        )
        assert response.status_code == 422
        assert "incomplete" in response.json()["detail"].lower()

    def test_unknown_formation_is_rejected(self, client, league, squad_of):
        response = client.post(
            "/api/simulate",
            json={"formationId": "9-9-9", "slots": build_valid_xi(league, squad_of)},
        )
        assert response.status_code == 422

    def test_player_not_in_the_named_squad_is_rejected(self, client, league, squad_of):
        slots = build_valid_xi(league, squad_of)
        slots[0]["playerId"] = 999_999
        response = client.post(
            "/api/simulate", json={"formationId": "4-3-3", "slots": slots}
        )
        assert response.status_code == 422
        assert "not in" in response.json()["detail"]

    def test_duplicate_player_is_rejected(self, client, league, squad_of):
        slots = build_valid_xi(league, squad_of)
        # Point two different slots at the same player.
        slots[2]["playerId"] = slots[1]["playerId"]
        slots[2]["team"] = slots[1]["team"]
        slots[2]["season"] = slots[1]["season"]
        response = client.post(
            "/api/simulate", json={"formationId": "4-3-3", "slots": slots}
        )
        assert response.status_code == 422
        assert "more than once" in response.json()["detail"]

    def test_out_of_position_placement_is_rejected(self, client, league, squad_of):
        """A keeper in an outfield slot is impossible in the UI, so a request
        containing one is tampered with and must not be simulated."""
        from app.engine.formations import eligible_families

        slots = build_valid_xi(league, squad_of)
        already_drafted = {s["playerId"] for s in slots}
        # A keeper who is *not* already in the XI, so this trips the eligibility
        # check rather than the duplicate-player check.
        keeper = next(
            p
            for squad in league.squads.values()
            for p in squad
            if eligible_families(p) == {"GK"} and p.id not in already_drafted
        )
        team, season = squad_of[keeper.id]
        striker_slot = next(s for s in slots if s["slotId"] == "st")
        striker_slot.update({"playerId": keeper.id, "team": team, "season": season})

        response = client.post(
            "/api/simulate", json={"formationId": "4-3-3", "slots": slots}
        )
        assert response.status_code == 422
        assert "cannot play" in response.json()["detail"]

    def test_budget_mode_reports_spend(self, client, league, squad_of):
        response = client.post(
            "/api/simulate",
            json={
                "formationId": "4-3-3",
                "slots": build_valid_xi(league, squad_of),
                "mode": "budget",
                "budgetCap": DEFAULT_BUDGET_CAP,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["totalSpent"] > 0

    def test_budget_overspend_is_rejected(self, client, league, squad_of):
        response = client.post(
            "/api/simulate",
            json={
                "formationId": "4-3-3",
                "slots": build_valid_xi(league, squad_of),
                "mode": "budget",
                "budgetCap": 1,
            },
        )
        assert response.status_code == 422
        assert "budget" in response.json()["detail"].lower()

    def test_classic_mode_ignores_budget(self, client, league, squad_of):
        response = client.post(
            "/api/simulate",
            json={
                "formationId": "4-3-3",
                "slots": build_valid_xi(league, squad_of),
                "mode": "classic",
                "budgetCap": 1,
            },
        )
        assert response.status_code == 200
        assert response.json()["totalSpent"] is None

    @pytest.mark.parametrize("formation_id", list(FORMATIONS))
    def test_every_formation_can_be_simulated(self, client, league, squad_of, formation_id):
        response = client.post(
            "/api/simulate",
            json={
                "formationId": formation_id,
                "slots": build_valid_xi(league, squad_of, formation_id),
            },
        )
        assert response.status_code == 200, response.text

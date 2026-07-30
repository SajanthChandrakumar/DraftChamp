from __future__ import annotations

import math

from app.engine.formations import (
    FORMATIONS,
    eligible_families,
    is_draft_complete,
    open_slots_for,
)
from app.engine.records import PL_RECORDS, evaluate_all, get_record
from app.engine.rng import hash_string, seeded_rng
from app.engine.simulation import (
    compute_squad_strength,
    js_round,
    simulate_season,
)
from app.models import Player, PlayerAttributes


def make_player(pid: int, positions: list[str], overall: int) -> Player:
    return Player(
        id=pid,
        name=f"Player {pid}",
        positions=positions,
        overall=overall,
        age=25,
        attributes=PlayerAttributes(
            pace=overall,
            shooting=overall,
            passing=overall,
            dribbling=overall,
            defending=overall,
            physical=overall,
        ),
    )


POSITION_BY_FAMILY = {"GK": "GK", "DEF": "CB", "MID": "CM", "FWD": "ST"}


def build_xi(overall: int, formation_id: str = "4-3-3", out_of_position: bool = False):
    filled = {}
    pid = 1
    for slot in FORMATIONS[formation_id]:
        position = "GK" if out_of_position else POSITION_BY_FAMILY[slot.fam]
        filled[slot.id] = make_player(pid, [position], overall)
        pid += 1
    return filled


class TestRng:
    def test_hash_is_deterministic(self):
        assert hash_string("gk,cb1,cb2") == hash_string("gk,cb1,cb2")

    def test_hash_matches_known_javascript_values(self):
        # Captured from the original JS implementation this was ported from.
        assert hash_string("gk,cb1,cb2") == 3237801578
        assert hash_string("abc") == 440920331
        assert hash_string("") == 2166136261

    def test_seeded_sequence_matches_known_javascript_values(self):
        rng = seeded_rng(hash_string("abc"))
        assert [rng() for _ in range(3)] == [
            0.5166419988963753,
            0.6596221292857081,
            0.0018796597141772509,
        ]

    def test_values_in_unit_interval(self):
        rng = seeded_rng(hash_string("test"))
        for _ in range(200):
            value = rng()
            assert 0.0 <= value < 1.0


class TestJsRound:
    def test_rounds_halves_toward_positive_infinity(self):
        # Python's built-in round() would give 2 and -2 here; JS gives 3 and -2.
        assert js_round(2.5) == 3
        assert js_round(-2.5) == -2
        assert js_round(2.4) == 2
        assert js_round(0.5) == 1


class TestFormations:
    def test_every_formation_has_eleven_slots(self):
        for formation_id, slots in FORMATIONS.items():
            assert len(slots) == 11, formation_id

    def test_slot_ids_are_unique_within_a_formation(self):
        for formation_id, slots in FORMATIONS.items():
            ids = [s.id for s in slots]
            assert len(ids) == len(set(ids)), formation_id

    def test_multi_position_player_matches_its_families(self):
        player = make_player(1, ["CM", "CAM"], 80)
        slots = open_slots_for(player, "4-3-3", {})
        assert slots
        assert all(s.fam == "MID" for s in slots)

    def test_filled_slots_are_excluded(self):
        player = make_player(1, ["CM"], 80)
        all_slots = open_slots_for(player, "4-3-3", {})
        filled = {all_slots[0].id: make_player(2, ["CM"], 80)}
        remaining = open_slots_for(player, "4-3-3", filled)
        assert len(remaining) == len(all_slots) - 1

    def test_keeper_only_matches_the_keeper_slot(self):
        slots = open_slots_for(make_player(1, ["GK"], 80), "4-3-3", {})
        assert [s.fam for s in slots] == ["GK"]

    def test_draft_completion(self):
        assert not is_draft_complete({}, "4-3-3")
        assert is_draft_complete(build_xi(75), "4-3-3")

    def test_eligible_families_ignores_unknown_positions(self):
        player = make_player(1, ["CM"], 80)
        assert eligible_families(player) == {"MID"}


class TestSimulation:
    def test_is_deterministic(self):
        xi = build_xi(85)
        assert simulate_season(xi, "4-3-3") == simulate_season(xi, "4-3-3")

    def test_result_does_not_depend_on_slot_insertion_order(self):
        xi = build_xi(85)
        reversed_xi = dict(reversed(list(xi.items())))
        assert simulate_season(xi, "4-3-3") == simulate_season(reversed_xi, "4-3-3")

    def test_season_always_totals_38_games(self):
        for overall in (40, 60, 75, 90, 99):
            season = simulate_season(build_xi(overall), "4-3-3")
            assert season.wins + season.draws + season.losses == 38
            assert season.points == season.wins * 3 + season.draws

    def test_out_of_position_xi_is_weaker(self):
        assert compute_squad_strength(
            build_xi(80, out_of_position=True), "4-3-3"
        ) < compute_squad_strength(build_xi(80), "4-3-3")

    def test_stronger_squad_scores_more_and_concedes_less(self):
        strong = simulate_season(build_xi(95), "4-3-3")
        weak = simulate_season(build_xi(45), "4-3-3")
        assert strong.goals_for > weak.goals_for
        assert strong.goals_conceded < weak.goals_conceded

    def test_goal_figures_are_plausible(self):
        for overall in (40, 60, 75, 90, 99):
            season = simulate_season(build_xi(overall), "4-3-3")
            assert season.goals_for > 0
            assert season.goals_conceded > 0
            assert 0 < season.top_scorer_goals <= season.goals_for

    def test_works_for_every_formation(self):
        for formation_id in FORMATIONS:
            season = simulate_season(build_xi(80, formation_id), formation_id)
            assert season.wins + season.draws + season.losses == 38

    def test_top_band_stays_rare_across_a_realistic_quality_spread(self):
        rng = seeded_rng(12345)
        samples = 500
        legendary = 0
        for _ in range(samples):
            overall = 40 + math.floor(rng() ** 2 * 60)
            if simulate_season(build_xi(overall), "4-3-3").tier == "Legendary":
                legendary += 1
        assert legendary / samples < 0.1


class TestRecords:
    def test_every_record_is_retrievable_by_id(self):
        for record in PL_RECORDS:
            assert get_record(record.id) == record

    def test_unknown_id_returns_none(self):
        assert get_record("nope") is None

    def test_all_records_are_evaluated_for_any_season(self):
        outcomes = evaluate_all(simulate_season(build_xi(75), "4-3-3"))
        assert len(outcomes) == len(PL_RECORDS)
        assert {o.record.id for o in outcomes} == {r.id for r in PL_RECORDS}

    def test_a_weak_squad_beats_nothing(self):
        outcomes = evaluate_all(simulate_season(build_xi(45), "4-3-3"))
        assert not any(o.achieved for o in outcomes)

    def test_lower_is_better_records_invert_the_comparison(self):
        season = simulate_season(build_xi(99), "4-3-3")
        season.goals_conceded = 10
        season.losses = 0
        outcomes = {o.record.id: o for o in evaluate_all(season)}
        assert outcomes["fewest-conceded"].achieved
        assert outcomes["invincible"].achieved

        season.goals_conceded = 40
        season.losses = 3
        outcomes = {o.record.id: o for o in evaluate_all(season)}
        assert not outcomes["fewest-conceded"].achieved
        assert not outcomes["invincible"].achieved

    def test_messages_are_non_empty(self):
        for outcome in evaluate_all(simulate_season(build_xi(80), "4-3-3")):
            assert outcome.message

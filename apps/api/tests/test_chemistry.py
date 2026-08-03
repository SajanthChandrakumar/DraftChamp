from __future__ import annotations

from app.engine.chemistry import DraftedPlayer, compute_chemistry
from app.models import Player, PlayerAttributes


def make_player(pid: int, nationality: str = "England") -> Player:
    return Player(
        id=pid,
        name=f"Player {pid}",
        positions=["CM"],
        overall=75,
        age=25,
        nationality=nationality,
        attributes=PlayerAttributes(
            pace=75, shooting=75, passing=75, dribbling=75, defending=75, physical=75
        ),
    )


def drafted(slot_id: str, pid: int, team: str, season: int, nationality: str = "England"):
    return DraftedPlayer(slot_id=slot_id, player=make_player(pid, nationality), team=team, season=season)


class TestPairClassification:
    def test_same_club_and_season_is_teammates(self):
        entries = [
            drafted("a", 1, "ARS", 2020),
            drafted("b", 2, "ARS", 2020),
        ]
        result = compute_chemistry(entries)
        assert result.teammate_pairs == 1
        assert result.clubmate_pairs == 0
        assert result.countryman_pairs == 0
        assert result.highlights[0].kind == "teammates"

    def test_same_club_different_season_is_clubmates(self):
        entries = [
            drafted("a", 1, "ARS", 2020),
            drafted("b", 2, "ARS", 2021),
        ]
        result = compute_chemistry(entries)
        assert result.teammate_pairs == 0
        assert result.clubmate_pairs == 1
        assert result.countryman_pairs == 0

    def test_different_club_same_nationality_is_countrymen(self):
        entries = [
            drafted("a", 1, "ARS", 2020, "France"),
            drafted("b", 2, "CHE", 2020, "France"),
        ]
        result = compute_chemistry(entries)
        assert result.teammate_pairs == 0
        assert result.clubmate_pairs == 0
        assert result.countryman_pairs == 1

    def test_no_shared_history_scores_nothing(self):
        entries = [
            drafted("a", 1, "ARS", 2020, "France"),
            drafted("b", 2, "CHE", 2021, "Spain"),
        ]
        result = compute_chemistry(entries)
        assert result.teammate_pairs == 0
        assert result.clubmate_pairs == 0
        assert result.countryman_pairs == 0
        assert result.score == 0
        assert result.highlights == []

    def test_teammates_takes_priority_over_countrymen(self):
        # Same club+season AND same nationality — the strongest fact wins,
        # a pair is never double-counted across categories.
        entries = [
            drafted("a", 1, "ARS", 2020, "England"),
            drafted("b", 2, "ARS", 2020, "England"),
        ]
        result = compute_chemistry(entries)
        assert result.teammate_pairs == 1
        assert result.countryman_pairs == 0


class TestScore:
    def test_is_zero_for_fewer_than_two_players(self):
        assert compute_chemistry([]).score == 0
        assert compute_chemistry([drafted("a", 1, "ARS", 2020)]).score == 0

    def test_an_all_teammates_xi_scores_100(self):
        entries = [drafted(str(i), i, "ARS", 2020) for i in range(11)]
        result = compute_chemistry(entries)
        assert result.score == 100
        assert result.teammate_pairs == 11 * 10 // 2

    def test_a_fully_disconnected_xi_scores_0(self):
        # Distinct clubs, distinct seasons, distinct nationalities throughout.
        clubs = ["ARS", "CHE", "MCI", "LIV", "TOT", "EVE", "MUN", "LEI", "WHU", "SOU", "NEW"]
        nations = [
            "England", "France", "Spain", "Brazil", "Germany", "Portugal",
            "Argentina", "Italy", "Netherlands", "Belgium", "Wales",
        ]
        entries = [
            drafted(str(i), i, clubs[i], 2010 + i, nations[i]) for i in range(11)
        ]
        result = compute_chemistry(entries)
        assert result.score == 0

    def test_score_is_symmetric_to_entry_order(self):
        entries = [
            drafted("a", 1, "ARS", 2020, "England"),
            drafted("b", 2, "ARS", 2020, "England"),
            drafted("c", 3, "CHE", 2021, "France"),
        ]
        forward = compute_chemistry(entries)
        backward = compute_chemistry(list(reversed(entries)))
        assert forward.score == backward.score
        assert forward.teammate_pairs == backward.teammate_pairs

    def test_score_stays_within_bounds(self):
        entries = [drafted(str(i), i, "ARS", 2020, "England") for i in range(11)]
        result = compute_chemistry(entries)
        assert 0 <= result.score <= 100


class TestHighlights:
    def test_are_capped_and_ordered_by_link_strength(self):
        entries = [
            drafted("a", 1, "ARS", 2020, "England"),
            drafted("b", 2, "ARS", 2021, "France"),  # clubmates with a
            drafted("c", 3, "CHE", 2020, "England"),  # countrymen with a
            drafted("d", 4, "ARS", 2020, "Spain"),  # teammates with a
        ]
        result = compute_chemistry(entries)
        kinds = [h.kind for h in result.highlights]
        assert kinds == sorted(kinds, key=lambda k: {"teammates": 0, "clubmates": 1, "countrymen": 2}[k])

    def test_detail_strings_name_the_real_connection(self):
        entries = [drafted("a", 1, "ARS", 2020), drafted("b", 2, "ARS", 2020)]
        result = compute_chemistry(entries)
        assert "ARS" in result.highlights[0].detail
        assert "2020" in result.highlights[0].detail

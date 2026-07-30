import type { SeasonRecord } from "./simulation";

export type RecordMetric = "points" | "unbeaten" | "goalsConceded" | "topScorerGoals";

export interface PLRecord {
  id: string;
  label: string;
  description: string;
  metric: RecordMetric;
  value: number;
  holder: string;
  season: string;
  /** true when a lower simulated value is the better outcome (e.g. goals conceded). */
  lowerIsBetter?: boolean;
}

// Real Premier League records (38-game-season era). Update these if/when the
// real dataset work surfaces a more precisely sourced figure.
export const PL_RECORDS: PLRecord[] = [
  {
    id: "most-points",
    label: "Most points in a season",
    description: "Manchester City set the record for the most points in a single Premier League season.",
    metric: "points",
    value: 100,
    holder: "Manchester City",
    season: "2017-18",
  },
  {
    id: "invincible",
    label: "Unbeaten season (“The Invincibles”)",
    description: "Arsenal went the entire 38-game season without losing a single match.",
    metric: "unbeaten",
    value: 0,
    holder: "Arsenal",
    season: "2003-04",
  },
  {
    id: "fewest-conceded",
    label: "Fewest goals conceded",
    description: "Chelsea conceded a record-low tally across the season.",
    metric: "goalsConceded",
    value: 15,
    holder: "Chelsea",
    season: "2004-05",
    lowerIsBetter: true,
  },
  {
    id: "top-scorer",
    label: "Most goals by one player in a season",
    description: "Erling Haaland scored a record haul in a single 38-game season.",
    metric: "topScorerGoals",
    value: 36,
    holder: "Erling Haaland",
    season: "2022-23",
  },
];

export function getRecordById(id: string): PLRecord | undefined {
  return PL_RECORDS.find((r) => r.id === id);
}

export interface RecordComparison {
  achieved: boolean;
  message: string;
}

export function compareToRecord(season: SeasonRecord, record: PLRecord): RecordComparison {
  switch (record.metric) {
    case "points": {
      const achieved = season.points >= record.value;
      return {
        achieved,
        message: achieved
          ? `Record broken! ${season.points} points beats ${record.holder}'s ${record.value} (${record.season}).`
          : `${record.value - season.points} points short of ${record.holder}'s ${record.value} (${record.season}).`,
      };
    }
    case "unbeaten": {
      const achieved = season.losses === 0;
      return {
        achieved,
        message: achieved
          ? `Unbeaten! You matched ${record.holder}'s ${record.season} invincible season.`
          : `${season.losses} loss${season.losses === 1 ? "" : "es"} — ${record.holder} (${record.season}) went the whole season unbeaten.`,
      };
    }
    case "goalsConceded": {
      const achieved = season.goalsConceded <= record.value;
      return {
        achieved,
        message: achieved
          ? `Record broken! ${season.goalsConceded} conceded beats ${record.holder}'s ${record.value} (${record.season}).`
          : `Conceded ${season.goalsConceded} — ${record.value - season.goalsConceded} more than ${record.holder}'s record ${record.value} (${record.season}).`,
      };
    }
    case "topScorerGoals": {
      const achieved = season.topScorerGoals >= record.value;
      return {
        achieved,
        message: achieved
          ? `Record broken! ${season.topScorerGoals} goals beats ${record.holder}'s ${record.value} (${record.season}).`
          : `${record.value - season.topScorerGoals} goals short of ${record.holder}'s ${record.value} (${record.season}).`,
      };
    }
  }
}

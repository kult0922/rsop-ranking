export type User = {
  id: number;
  name: string;
};

export type Season = {
  id: number;
  name: string;
};

export type Game = {
  id: number;
  season_id: number;
  name: string;
  date: string;
};

export type BBChange = {
  id: number;
  value: number;
  user_id: number;
  game_id: number;
};

export type ScheduleEvent = {
  id: number;
  name: string;
  created_at: string;
};

export type ScheduleCandidate = {
  id: number;
  event_id: number;
  date: string;
};

export type ScheduleResponse = {
  id: number;
  event_id: number;
  user_id: number;
  candidate_id: number;
  status: "ok" | "maybe" | "ng";
};

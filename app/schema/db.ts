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

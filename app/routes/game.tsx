import { Calendar } from "@/components/ui/calendar";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";

interface Env {
  DB: D1Database;
}

type User = {
  id: number;
  name: string;
};

type Game = {
  id: number;
  name: string;
  date: string;
};

type BBChange = {
  id: number;
  value: number;
  user_id: number;
  game_id: number;
};

export async function loader({ context }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const { results: games } = await env.DB.prepare(
    "SELECT * FROM games"
  ).all<Game>();

  return json({
    users,
    games,
  });
}

export default function Index() {
  const { users, games } = useLoaderData<typeof loader>();
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>RSOP Game</h1>
      <Link to="/">home</Link>

      <form>
        game name: <input placeholder="RSOP S1-1" />
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        {users.map((user) => {
          return (
            <div key={user.id}>
              {user.name}
              <input placeholder="BB" />
            </div>
          );
        })}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

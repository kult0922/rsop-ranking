import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import type {
  ActionFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
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

  const { results: games } = await env.DB.prepare(
    "SELECT * FROM games"
  ).all<Game>();

  return json({
    games,
  });
}

export default function Index() {
  const { games } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>RSOP Games</h1>
      <Link to="/">home</Link>
      {games.map((game) => (
        <div>
          <Link to={"/games/" + game.id} className="underline">
            {game.name}
          </Link>
        </div>
      ))}
    </div>
  );
}

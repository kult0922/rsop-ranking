import GameFormInputs from "@/components/domain/gameFormInputs";
import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";

interface Env {
  DB: D1Database;
}

export type User = {
  id: number;
  name: string;
};

export type Game = {
  id: number;
  name: string;
  date: Date;
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

  return json({
    users,
  });
}

export const action: ActionFunction = async ({ context, request }) => {
  // @ts-ignore
  const env = context.cloudflare.env as Env;
  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const formData = await request.formData();
  const gameName = await formData.get("game_name");
  const date = await formData.get("date");

  const { meta } = await env.DB.prepare(
    `insert into games (name, date) values (?, ?)`
  )
    .bind(gameName, date)
    .run();

  const gameId = meta.last_row_id;

  for (const user of users) {
    const bbChange = await formData.get(`bb_changes_${user.id}`);
    if (bbChange == null) continue;
    const { success } = await env.DB.prepare(
      `insert into bb_change (value, user_id, game_id) values (?, ?, ?)`
    )
      .bind(bbChange, user.id, gameId)
      .run();
  }

  return json({ formData });
};

export default function Index() {
  const { users } = useLoaderData<typeof loader>();

  const defaultBBChanges = users.map((user) => {
    return {
      userId: user.id,
      value: null,
      userName: user.name,
    };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>RSOP Game</h1>
      <Link to="/">home</Link>

      <form method="post" className="space-y-8">
        <GameFormInputs
          defaultBBChanges={defaultBBChanges}
          defaultDate={new Date()}
          defaultName=""
        />
      </form>
    </div>
  );
}

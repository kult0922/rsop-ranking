import GameFormInputs from "~/@/components/domain/gameFormInputs";
import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { Season, User } from "~/schema/db";
import { CURRENT_SEASON } from "~/constant";

interface Env {
  DB: D1Database;
}

export async function loader({ context }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const { results: seasons } = await env.DB.prepare(
    "SELECT * FROM seasons"
  ).all<Season>();

  return json({
    users,
    seasons,
    currentSeason: CURRENT_SEASON,
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
  const season = await formData.get("season");

  const { meta } = await env.DB.prepare(
    `insert into games (name, date, season_id) values (?, ?, ?)`
  )
    .bind(gameName, date, season)
    .run();

  const gameId = meta.last_row_id;

  for (const user of users) {
    const bbChange = await formData.get(`bb_changes_${user.id}`);
    if (bbChange == null || bbChange === "") continue;
    const { success } = await env.DB.prepare(
      `insert into bb_change (value, user_id, game_id) values (?, ?, ?)`
    )
      .bind(bbChange, user.id, gameId)
      .run();
  }

  return redirect(`/`);
};

export default function Index() {
  const { users, seasons, currentSeason } = useLoaderData<typeof loader>();

  const defaultBBChanges = users.map((user) => {
    return {
      userId: user.id,
      value: null,
      userName: user.name,
    };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div className="flex justify-between mt-3">
        <Link to="/">
          <h1 className="text-2xl ml-2">♠ RSOP</h1>
        </Link>
      </div>

      <form method="post" className="space-y-8">
        <div className="flex justify-center my-6">
          <GameFormInputs
            defaultBBChanges={defaultBBChanges}
            defaultSeason={currentSeason}
            defaultDate={new Date()}
            seasons={seasons}
            defaultName=""
          />
        </div>
      </form>
    </div>
  );
}

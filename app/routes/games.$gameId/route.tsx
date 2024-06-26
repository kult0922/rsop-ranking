import GameFormInputs from "~/@/components/domain/gameFormInputs";
import { Button } from "~/@/components/ui/button";
import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { BBChange, Game, Season, User } from "~/schema/db";
import { CURRENT_SEASON } from "~/constant";

interface Env {
  DB: D1Database;
}

export async function loader({ context, params }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  const game = await env.DB.prepare("SELECT * FROM games WHERE id = ?")
    .bind(params.gameId)
    .first<Game>();

  const { results: bbChanges } = await env.DB.prepare(
    "SELECT * FROM bb_change WHERE game_id = ?"
  )
    .bind(params.gameId)
    .all<BBChange>();

  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const { results: seasons } = await env.DB.prepare(
    "SELECT * FROM seasons"
  ).all<Season>();

  const bbChanges_ = bbChanges.map((bbChange) => {
    return {
      ...bbChange,
      userName: users.find((user) => user.id === bbChange.user_id)?.name ?? "",
    };
  });

  const seasonId = game?.season_id ?? CURRENT_SEASON;

  return json({
    game,
    bbChanges_,
    seasons,
    seasonId,
  });
}

export const action: ActionFunction = async ({ context, request, params }) => {
  const formData = await request.formData();
  const action = await formData.get("_action");
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  if (action === "delete") {
    // delete bb_change table
    await env.DB.prepare("DELETE FROM bb_change WHERE game_id = ?")
      .bind(params.gameId)
      .run();

    // delete game table
    await env.DB.prepare("DELETE FROM games WHERE id = ?")
      .bind(params.gameId)
      .run();

    return redirect("/");
  }

  // get game table
  const { results: bbChanges } = await env.DB.prepare(
    "SELECT * FROM bb_change WHERE game_id = ?"
  )
    .bind(params.gameId)
    .all<BBChange>();

  const gameName = await formData.get("game_name");
  const date = await formData.get("date");
  const season = await formData.get("season");

  // games table update
  const { success } = await env.DB.prepare(
    `update games set name=?, date=?, season_id=? where id = ?`
  )
    .bind(gameName, date, season, params.gameId)
    .run();

  for (const bbChange_ of bbChanges) {
    const bbChangeValue = await formData.get(`bb_changes_${bbChange_.user_id}`);
    if (bbChangeValue == null) continue;
    // bb_change table update
    const { success } = await env.DB.prepare(
      `update bb_change set value=? where game_id = ? and user_id = ?`
    )
      .bind(bbChangeValue, params.gameId, bbChange_.user_id)
      .run();
  }

  return redirect("/");
};

export default function Index() {
  const { game, bbChanges_, seasons, seasonId } =
    useLoaderData<typeof loader>();

  const defaultBBChanges = bbChanges_.map((bbChange) => {
    return {
      userId: bbChange.user_id,
      value: bbChange.value,
      userName: bbChange.userName,
    };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div className="flex justify-between mt-3">
        <Link to="/">
          <h1 className="text-2xl ml-2">♠ RSOP</h1>
        </Link>
      </div>

      <Form method="post" className="space-y-8">
        <div className="flex justify-center my-6">
          <GameFormInputs
            defaultSeason={seasonId}
            seasons={seasons}
            defaultBBChanges={defaultBBChanges}
            defaultDate={new Date(game?.date ?? "")}
            defaultName={game?.name ?? ""}
          />
        </div>
      </Form>

      <Form method="post" className="space-y-8 my-4">
        <div className="flex justify-end mr-6">
          <Button
            variant="destructive"
            type="submit"
            name="_action"
            value={"delete"}
          >
            delete
          </Button>
        </div>
      </Form>
    </div>
  );
}

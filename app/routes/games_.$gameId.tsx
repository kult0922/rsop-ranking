import GameFormInputs from "@/components/domain/gameFormInputs";
import { Button } from "@/components/ui/button";
import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { BBChange, Game, User } from "~/schema/db";

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

  const bbChanges_ = bbChanges.map((bbChange) => {
    return {
      ...bbChange,
      userName: users.find((user) => user.id === bbChange.user_id)?.name ?? "",
    };
  });

  return json({
    game,
    bbChanges_,
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

    return redirect("/games");
  }

  // get game table
  const { results: bbChanges } = await env.DB.prepare(
    "SELECT * FROM bb_change WHERE game_id = ?"
  )
    .bind(params.gameId)
    .all<BBChange>();

  const gameName = await formData.get("game_name");
  const date = await formData.get("date");

  // games table update
  const { success } = await env.DB.prepare(
    `update games set name=?, date=? where id = ?`
  )
    .bind(gameName, date, params.gameId)
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

  return json({ formData });
};

export default function Index() {
  const { game, bbChanges_ } = useLoaderData<typeof loader>();

  const defaultBBChanges = bbChanges_.map((bbChange) => {
    return {
      userId: bbChange.user_id,
      value: bbChange.value,
      userName: bbChange.userName,
    };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>RSOP Game</h1>
      <Link to="/">home</Link>

      <Form method="post" className="space-y-8">
        <GameFormInputs
          defaultBBChanges={defaultBBChanges}
          defaultDate={new Date(game?.date ?? "")}
          defaultName={game?.name ?? ""}
        />
      </Form>

      <Form method="post" className="space-y-8">
        <Button type="submit" name="_action" value={"delete"}>
          delete
        </Button>
      </Form>
    </div>
  );
}

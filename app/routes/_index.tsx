import { ResponsiveLine } from "@nivo/line";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { User, Game, BBChange } from "~/schema/db";

interface Env {
  DB: D1Database;
}

export async function loader({ context }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const { results: games } = await env.DB.prepare(
    "SELECT * FROM games"
  ).all<Game>();

  const { results: bbChange } = await env.DB.prepare(
    "SELECT * FROM bb_change"
  ).all<BBChange>();

  games.sort((a, b) => a.date.localeCompare(b.date));

  // 重複を削除してユーザIUを取得
  const participantUserIds = new Set(bbChange.map((bb) => bb.user_id));
  const heldGameIds = new Set(bbChange.map((bb) => bb.game_id));

  const heldGames = games.filter((game) => heldGameIds.has(game.id));

  const gameId2Users = new Map<number, { userId: number; value: number }[]>();
  bbChange.forEach((bb) => {
    if (!gameId2Users.has(bb.game_id)) {
      gameId2Users.set(bb.game_id, []);
    }
    gameId2Users.get(bb.game_id)!.push({ userId: bb.user_id, value: bb.value });
  });

  const data = [];

  for (const userId of participantUserIds) {
    const user = users.find((user) => user.id === userId);
    if (!user) continue;
    let acc = 0;
    const userValues = [{ x: "", y: acc }];
    for (const game of heldGames) {
      const bb = gameId2Users.get(game.id)!.find((bb) => bb.userId === userId);
      console.log(user.name, "bb", bb);
      acc += bb?.value ?? 0;
      userValues.push({ x: game.name, y: acc });
    }
    data.push({
      id: user.name,
      data: userValues,
    });
  }

  return json({
    data,
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { data } = useLoaderData<typeof loader>();
  console.log(data);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>RSOP</h1>
      <div
        style={{
          width: "500px",
          height: "500px",
        }}
      >
        <ResponsiveLine
          data={data}
          colors={{ scheme: "dark2" }}
          theme={{
            tooltip: {
              container: {
                color: "#000",
              },
            },
            legends: {
              text: {
                fill: "#fff",
                fontSize: 12,
              },
            },
            axis: {
              ticks: {
                text: {
                  fill: "#fff",
                },
              },
              legend: {
                text: {
                  fill: "#fff",
                },
              },
            },
          }}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            stacked: false,
            min: "auto",
            max: "auto",
          }}
          yFormat=" >-.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "stack",
            legendOffset: 36,
            legendPosition: "middle",
            truncateTickAt: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "BB",
            legendOffset: -40,
            legendPosition: "middle",
            truncateTickAt: 0,
          }}
          pointSize={10}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          pointLabelYOffset={0}
          enableTouchCrosshair={true}
          useMesh={true}
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: "left-to-right",
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: "circle",
              symbolBorderColor: "rgba(0, 0, 0, .5)",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemBackground: "rgba(0, 0, 0, .03)",
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
        />
      </div>
      <div>
        <Link to="/new-game">new game</Link>
      </div>
      <div>
        <Link to="/games">games</Link>
      </div>
    </div>
  );
}

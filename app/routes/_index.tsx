import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/@/components/ui/card";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { User, Game, BBChange } from "~/schema/db";
import {
  LineChart,
  Line,
  Legend,
  Tooltip,
  YAxis,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Button } from "~/@/components/ui/button";
import { Separator } from "~/@/components/ui/separator";

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
  const participantUsers = users.filter((user) =>
    participantUserIds.has(user.id)
  );
  const heldGameIds = new Set(bbChange.map((bb) => bb.game_id));

  const heldGames = games.filter((game) => heldGameIds.has(game.id));

  const gameId2Users = new Map<
    number,
    { userId: number; value: number; userName: string }[]
  >();
  bbChange.forEach((bb) => {
    if (!gameId2Users.has(bb.game_id)) {
      gameId2Users.set(bb.game_id, []);
    }
    gameId2Users.get(bb.game_id)!.push({
      userId: bb.user_id,
      value: bb.value,
      userName: users.find((user) => user.id === bb.user_id)?.name ?? "",
    });
  });

  const gameResults = [];
  for (const [gameId, bbChanges] of gameId2Users) {
    gameResults.push({
      gameId,
      bbChanges: bbChanges.sort((a, b) => b.value - a.value),
      gameName: games.find((game) => game.id === gameId)?.name,
      date: games.find((game) => game.id === gameId)?.date,
    });
  }

  const dataByUsers: any[] = [];
  const currentResult: { name: string; value: number }[] = [];

  for (const userId of participantUserIds) {
    const user = users.find((user) => user.id === userId);
    if (!user) continue;
    let acc = 0;
    const userValues = new Map<number, { acc: number; gameName: string }>();
    for (const game of heldGames) {
      const bb = gameId2Users.get(game.id)!.find((bb) => bb.userId === userId);
      if (!bb) continue;
      acc += bb.value;
      userValues.set(game.id, { acc, gameName: game.name });
    }
    dataByUsers.push({
      name: user.name,
      id: user.id,
      data: userValues,
    });
    currentResult.push({
      name: user.name,
      value: acc,
    });
  }

  const data = [];
  // すべての参加者のグラフの一番初めに0を打つ
  const initPoint: any = { name: "" };
  for (const user of participantUsers) {
    initPoint[user.name] = 0;
  }
  data.push(initPoint);

  for (const game of heldGames) {
    const point: any = { name: game.name };
    for (const user of dataByUsers) {
      const value = user.data.get(game.id);
      if (value) {
        point[user.name] = value.acc;
      }
    }
    data.push(point);
  }
  currentResult.sort((a, b) => b.value - a.value);

  return json({
    data,
    gameResults,
    currentResult,
    participantUsers,
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const rankSufix = (rank: number) => {
  if (rank === 1) {
    return "st";
  } else if (rank === 2) {
    return "nd";
  } else if (rank === 3) {
    return "rd";
  } else {
    return "th";
  }
};

const rankIcon = (rank: number) => {
  if (rank === 1) {
    return "🥇";
  } else if (rank === 2) {
    return "🥈";
  } else if (rank === 3) {
    return "🥉";
  } else {
    return " ";
  }
};

export default function Index() {
  const { gameResults, data, participantUsers, currentResult } =
    useLoaderData<typeof loader>();

  console.log(data);
  console.log(currentResult);

  const colors = [
    "#ff595e",
    "#ff924c",
    "#ffca3a",
    "#8ac926",
    "#52a675",
    "#1982c4",
    "#6a4c93",
    "#4267ac",
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div className="flex justify-between mt-3">
        <h1 className="text-2xl ml-2">♠ RSOP</h1>
        <Link to="/new-game" className="mr-2">
          <Button variant="outline">new game</Button>
        </Link>
      </div>

      <Separator className="my-2" />

      <div className="flex justify-center my-4">
        <Card className="w-3/4">
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>Total BB</CardDescription>
          </CardHeader>
          <CardContent>
            {currentResult.map((result, index) => (
              <div key={result.name} className="flex m-2">
                <div className="w-16 flex">
                  <div className="w-6">{rankIcon(index + 1)}</div>
                  {index + 1}
                  {rankSufix(index + 1)}
                </div>
                <div className="w-16">{result.name}</div>
                {result.value > 0 ? (
                  <div className="text-green-500">+{result.value}</div>
                ) : (
                  <div className="text-red-500">{result.value}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <h2 className="text-xl ml-2 my-4 ">History</h2>
      <Separator className="my-3" />

      <div className="flex justify-center my-4">
        <Card className="w-[94%] h-96">
          <CardHeader>
            <CardTitle>BB raise and fall</CardTitle>
          </CardHeader>
          <CardContent className="w-full h-[90%]">
            <ResponsiveContainer width="100%">
              <LineChart height={400} data={data}>
                {participantUsers.map((user, index) => (
                  <Line
                    key={`line-${index}`}
                    dot={{ fill: colors[index], r: 3 }}
                    type="monotone"
                    dataKey={user.name}
                    stroke={colors[index]}
                    strokeWidth={1.5}
                  />
                ))}
                <CartesianGrid />
                <YAxis />
                <XAxis dataKey="name" />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    border: "none",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {gameResults.map((gameResult) => (
        <Link to={`/games/${gameResult.gameId}`}>
          <div className="flex justify-center m-2">
            <Card className="w-3/4">
              <CardHeader>
                <CardTitle>{gameResult.gameName}</CardTitle>
                <CardDescription>{gameResult.date}</CardDescription>
              </CardHeader>
              <CardContent>
                {gameResult.bbChanges.map((bbChange, index) => (
                  <div className="flex" key={bbChange.userId}>
                    <div className="w-8">
                      {index + 1}
                      {rankSufix(index + 1)}
                    </div>
                    <div className="ml-2 w-20">{bbChange.userName}</div>
                    {bbChange.value > 0 ? (
                      <div className="ml-2 text-green-500">
                        +{bbChange.value}
                      </div>
                    ) : (
                      <div className="ml-2 text-red-500">{bbChange.value}</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </Link>
      ))}
    </div>
  );
}

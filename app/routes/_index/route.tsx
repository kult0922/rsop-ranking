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
import { User, Game, BBChange, Season } from "~/schema/db";
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
import { CURRENT_SEASON } from "~/constant";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/@/components/ui/select";
import { useNavigate } from "@remix-run/react";
import { orgRound, rankIcon, rankSufix } from "./functions/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

interface Env {
  DB: D1Database;
}

type UserAttribute = User & {
  color: string;
};

type ChartPoint = {
  name: string;
  [key: string]: number | string;
};

export async function loader({ context, request }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  let { searchParams } = new URL(request.url);
  const season = searchParams.get("season") ?? CURRENT_SEASON;

  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const { results: seasons } = await env.DB.prepare(
    "SELECT * FROM seasons"
  ).all<Season>();

  const { results: games } = await env.DB.prepare(
    "SELECT * FROM games WHERE season_id = ?"
  )
    .bind(season)
    .all<Game>();

  const { results: allBBChange } = await env.DB.prepare(
    "SELECT * FROM bb_change"
  ).all<BBChange>();
  games.sort((a, b) => a.date.localeCompare(b.date));

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

  // 現在のseasonのみを取得
  const bbChange = allBBChange.filter((bb) =>
    games.find((game) => game.id === bb.game_id)
  );

  // 重複を削除してユーザIUを取得
  const participantUserIds = new Set(bbChange.map((bb) => bb.user_id));
  const participantUsers = users.filter((user) =>
    participantUserIds.has(user.id)
  );

  const participantUsersAttribute: UserAttribute[] = participantUsers.map(
    (user, index) => {
      return { ...user, color: colors[index] };
    }
  );

  const heldGameIds = new Set(bbChange.map((bb) => bb.game_id));
  const heldGames = games.filter((game) => heldGameIds.has(game.id));

  const gameResults = new Map<
    number,
    { userId: number; value: number; userName: string }[]
  >();
  bbChange.forEach((bb) => {
    if (!gameResults.has(bb.game_id)) {
      gameResults.set(bb.game_id, []);
    }
    gameResults.get(bb.game_id)!.push({
      userId: bb.user_id,
      value: bb.value,
      userName: users.find((user) => user.id === bb.user_id)?.name ?? "",
    });
  });

  const gameResultArray = [];
  for (const [gameId, bbChanges] of gameResults) {
    gameResultArray.push({
      gameId,
      bbChanges: bbChanges.sort((a, b) => b.value - a.value),
      gameName: games.find((game) => game.id === gameId)?.name,
      date: games.find((game) => game.id === gameId)?.date,
    });
  }

  const dataByUsers: {
    name: string;
    id: number;
    data: Map<
      number,
      {
        acc: number;
        gameName: string;
      }
    >;
  }[] = [];
  const currentResult: { name: string; value: number }[] = [];

  for (const userId of participantUserIds) {
    const user = users.find((user) => user.id === userId);
    if (!user) continue;
    let acc = 0;
    const userValues = new Map<number, { acc: number; gameName: string }>();
    for (const game of heldGames) {
      const bb = gameResults.get(game.id)!.find((bb) => bb.userId === userId);
      if (!bb) continue;
      acc = orgRound(acc + bb.value, 10);
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

  const dataForChart = [];
  // すべての参加者のグラフの一番初めに0を打つ
  const initPoint: ChartPoint = { name: "" };

  for (const user of participantUsers) {
    initPoint[user.name] = 0;
  }
  dataForChart.push(initPoint);

  for (const game of heldGames) {
    const point: ChartPoint = { name: game.name };
    for (const user of dataByUsers) {
      const value = user.data.get(game.id);
      if (value) {
        point[user.name] = value.acc;
      }
    }
    dataForChart.push(point);
  }
  currentResult.sort((a, b) => b.value - a.value);

  return json({
    dataForChart,
    gameResultArray,
    currentResult,
    season,
    seasons,
    participantUsersAttribute,
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "RSOP Ranking" },
    { name: "description", content: "Welcome to RSOP Ranking!" },
    {
      property: "og:image",
      content: "https://rsop-ranking.pages.dev/ogp.webp",
    },
    {
      property: "og:url",
      content: "https://rsop-ranking.pages.dev",
    },
    {
      property: "og:title",
      content: ":RSOP Ranking",
    },
    {
      property: "og:description",
      content: ":RSOP Ranking web app",
    },
  ];
};

export default function Index() {
  const navigate = useNavigate();
  const {
    gameResultArray,
    dataForChart,
    participantUsersAttribute,
    currentResult,
    season,
    seasons,
  } = useLoaderData<typeof loader>();

  return (
    <>
      <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
        <div className="flex justify-between mt-3">
          {
            // NOTE: season id 3 is USA special season 🇺🇸
          }
          {season === "3" ? (
            <div className="flex items-center">
              <h1 className="text-2xl ml-2 font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#FFE53B] to-[#FF2525] ">
                ♠ RSOP
              </h1>
              <div className="text-3xl px-1">🇺🇸</div>
            </div>
          ) : (
            <h1 className="text-2xl ml-2 font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#fc00ff] to-[#00dbde] ">
              ♠ RSOPaaa
            </h1>
          )}
          <div className="mr-2">
            <Select
              defaultValue={season.toString()}
              onValueChange={(value) => {
                navigate(`/?season=${value}`);
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {seasons.map((season) => {
                    return (
                      <SelectItem key={season.id} value={season.id.toString()}>
                        {season.name}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            {}
          </div>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-center my-4">
          <Card className="w-80">
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
                  <div className="w-16 mr-3">{result.name}</div>
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
        <div className="flex justify-between items-center">
          <h2 className="text-xl ml-3">History</h2>
          <Link to="/new-game" className="mr-3">
            <Button variant="outline">new game</Button>
          </Link>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-center my-4">
          <Card className="w-[94%] h-96">
            <CardHeader>
              <CardTitle>BB raise and fall</CardTitle>
            </CardHeader>
            <CardContent className="w-full h-[90%]">
              <ResponsiveContainer width="100%">
                <LineChart height={400} data={dataForChart}>
                  {participantUsersAttribute.map((user, index) => (
                    <Line
                      key={`line-${index}`}
                      dot={{ fill: user.color, r: 3 }}
                      connectNulls
                      dataKey={user.name}
                      stroke={user.color}
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
        <div className="flex justify-center flex-wrap m-2">
          {gameResultArray.map((gameResult) => (
            <div className="m-3" key={gameResult.gameId}>
              <Card className="w-80">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{gameResult.gameName}</CardTitle>
                    <Link to={`/games/${gameResult.gameId}`}>
                      <Button className="" variant="outline">
                        Edit
                      </Button>
                    </Link>
                  </div>
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
                        <div className="ml-2 text-red-500">
                          {bbChange.value}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-2" />
      <div className="my-6 flex justify-center">
        <a href="https://github.com/kult0922/rsop-ranking">
          <div className="flex">
            <GitHubLogoIcon className="h-6 w-6" />
            <div className="mx-2 underline">Code</div>
          </div>
        </a>
      </div>
    </>
  );
}

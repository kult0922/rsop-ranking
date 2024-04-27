import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

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
  name: string;
  date: string;
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

  const { results: bbChange } = await env.DB.prepare(
    "SELECT * FROM bb_change"
  ).all<BBChange>();

  return json({
    users: users ?? [],
    games: games ?? [],
    bbChange: bbChange ?? [],
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { users } = useLoaderData<typeof loader>();
  console.log(users);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>

      {users.map((user: User) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

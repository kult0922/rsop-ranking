import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

interface Env {
  DB: D1Database;
}

type User = {
  id: number;
  username: string;
};

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;

  const { results } = await env.DB.prepare("SELECT * FROM users").all<User>();

  return json({
    users: results ?? [],
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
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>

      {users.map((user) => (
        <li key={user.id}>{user.username}</li>
      ))}
    </div>
  );
}

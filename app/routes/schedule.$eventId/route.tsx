import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/@/components/ui/select";
import { Separator } from "~/@/components/ui/separator";
import {
  ScheduleCandidate,
  ScheduleEvent,
  ScheduleResponse,
  User,
} from "~/schema/db";
import ScheduleResponseTable from "~/@/components/domain/scheduleResponseTable";

interface Env {
  DB: D1Database;
}

export async function loader({ context, params }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  const event = await env.DB.prepare(
    "SELECT * FROM schedule_events WHERE id = ?"
  )
    .bind(params.eventId)
    .first<ScheduleEvent>();

  if (!event) {
    throw new Response("Not Found", { status: 404 });
  }

  const { results: candidates } = await env.DB.prepare(
    "SELECT * FROM schedule_candidates WHERE event_id = ? ORDER BY date ASC"
  )
    .bind(params.eventId)
    .all<ScheduleCandidate>();

  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();

  const { results: responses } = await env.DB.prepare(
    "SELECT * FROM schedule_responses WHERE event_id = ?"
  )
    .bind(params.eventId)
    .all<ScheduleResponse>();

  return json({ event, candidates, users, responses });
}

export const action: ActionFunction = async ({ context, request, params }) => {
  // @ts-ignore
  const env = context.cloudflare.env as Env;
  const formData = await request.formData();

  const userId = formData.get("user_id");
  if (!userId) return redirect(`/schedule/${params.eventId}`);

  const { results: candidates } = await env.DB.prepare(
    "SELECT * FROM schedule_candidates WHERE event_id = ?"
  )
    .bind(params.eventId)
    .all<ScheduleCandidate>();

  const VALID_STATUSES = ["ok", "maybe", "ng"] as const;

  for (const candidate of candidates) {
    const raw = formData.get(`status_${candidate.id}`);
    const status = VALID_STATUSES.find((s) => s === raw);
    if (!status) {
      await env.DB.prepare(
        "DELETE FROM schedule_responses WHERE user_id = ? AND candidate_id = ?"
      )
        .bind(userId, candidate.id)
        .run();
    } else {
      await env.DB.prepare(
        `INSERT INTO schedule_responses (event_id, user_id, candidate_id, status)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, candidate_id) DO UPDATE SET status = excluded.status`
      )
        .bind(params.eventId, userId, candidate.id, status)
        .run();
    }
  }

  return redirect(`/schedule/${params.eventId}`);
};

export default function ScheduleDetail() {
  const { event, candidates, users, responses } =
    useLoaderData<typeof loader>();

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div className="flex justify-between mt-3">
        <Link to="/">
          <h1 className="text-2xl ml-2">♠ RSOP</h1>
        </Link>
      </div>
      <Separator className="my-2" />

      <div className="flex justify-center my-6">
        <Card className="w-[94%] max-w-2xl">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              あなたの名前を選んで○△✗をタップして回答してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">
                あなたは誰？
              </label>
              <Select
                onValueChange={(v) => setCurrentUserId(Number(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Form method="post">
              <input
                type="hidden"
                name="user_id"
                value={currentUserId ?? ""}
              />
              <ScheduleResponseTable
                key={currentUserId ?? "none"}
                candidates={candidates}
                users={users}
                responses={responses}
                currentUserId={currentUserId}
              />
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={currentUserId === null}>
                  回答を保存
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

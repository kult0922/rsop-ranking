import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { format, parseISO } from "date-fns";
import { Button } from "~/@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/@/components/ui/card";
import { Separator } from "~/@/components/ui/separator";
import { ScheduleEvent } from "~/schema/db";

interface Env {
  DB: D1Database;
}

export async function loader({ context }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;

  const { results: events } = await env.DB.prepare(
    "SELECT * FROM schedule_events ORDER BY created_at DESC"
  ).all<ScheduleEvent>();

  return json({ events });
}

export default function ScheduleIndex() {
  const { events } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div className="flex justify-between mt-3">
        <Link to="/">
          <h1 className="text-2xl ml-2">♠ RSOP</h1>
        </Link>
      </div>
      <Separator className="my-2" />

      <div className="flex justify-between items-center mx-3 my-4">
        <h2 className="text-xl font-bold">日程調整</h2>
        <Link to="/schedule/new">
          <Button variant="outline">新規作成</Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="w-[94%] max-w-2xl space-y-3">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>日程調整はまだありません</p>
              <Link to="/schedule/new" className="mt-4 inline-block">
                <Button>最初の日程調整を作成する</Button>
              </Link>
            </div>
          ) : (
            events.map((event) => (
              <Link to={`/schedule/${event.id}`} key={event.id}>
                <Card className="hover:bg-accent transition-colors cursor-pointer mb-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      作成日: {format(parseISO(event.created_at), "yyyy-MM-dd")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

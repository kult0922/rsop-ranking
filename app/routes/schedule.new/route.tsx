import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "~/@/components/ui/button";
import { Calendar } from "~/@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "~/@/components/ui/card";
import { Input } from "~/@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/@/components/ui/select";
import { cn } from "~/@/lib/utils";
import { User } from "~/schema/db";

interface Env {
  DB: D1Database;
}

export async function loader({ context }: LoaderFunctionArgs) {
  // @ts-ignore
  const env = context.cloudflare.env as Env;
  const { results: users } = await env.DB.prepare(
    "SELECT * FROM users"
  ).all<User>();
  return json({ users });
}

export const action: ActionFunction = async ({ context, request }) => {
  // @ts-ignore
  const env = context.cloudflare.env as Env;
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const creatorUserId = formData.get("creator_user_id") as string | null;
  const candidateDates = formData.getAll("candidate_date") as string[];

  if (!name || candidateDates.length === 0) {
    return json({ error: "タイトルと候補日を入力してください" }, { status: 400 });
  }

  const { meta } = await env.DB.prepare(
    "INSERT INTO schedule_events (name) VALUES (?)"
  )
    .bind(name)
    .run();

  const eventId = meta.last_row_id;

  for (const date of candidateDates) {
    const { meta: candidateMeta } = await env.DB.prepare(
      "INSERT INTO schedule_candidates (event_id, date) VALUES (?, ?)"
    )
      .bind(eventId, date)
      .run();

    // 作成者が選択されている場合、全候補日に ○ を自動登録
    if (creatorUserId) {
      await env.DB.prepare(
        `INSERT INTO schedule_responses (event_id, user_id, candidate_id, status)
         VALUES (?, ?, ?, 'ok')
         ON CONFLICT(user_id, candidate_id) DO UPDATE SET status = 'ok'`
      )
        .bind(eventId, creatorUserId, candidateMeta.last_row_id)
        .run();
    }
  }

  return redirect(`/schedule/${eventId}`);
};

export default function ScheduleNew() {
  const { users } = useLoaderData<typeof loader>();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [creatorUserId, setCreatorUserId] = useState<string>("");

  const toggleDate = (date: Date | undefined) => {
    if (!date) return;
    const formatted = format(date, "yyyy-MM-dd");
    setSelectedDates((prev) => {
      const exists = prev.some((d) => format(d, "yyyy-MM-dd") === formatted);
      if (exists) {
        return prev.filter((d) => format(d, "yyyy-MM-dd") !== formatted);
      }
      return [...prev].concat(date).sort((a, b) => a.getTime() - b.getTime());
    });
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div className="flex justify-between mt-3">
        <Link to="/">
          <h1 className="text-2xl ml-2">♠ RSOP</h1>
        </Link>
      </div>

      <form method="post">
        <input type="hidden" name="creator_user_id" value={creatorUserId} />
        {selectedDates.map((d) => (
          <input
            key={format(d, "yyyy-MM-dd")}
            type="hidden"
            name="candidate_date"
            value={format(d, "yyyy-MM-dd")}
          />
        ))}
        <div className="flex justify-center my-6">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>日程調整を作成</CardTitle>
            </CardHeader>
            <CardContent>
              タイトル
              <Input
                name="name"
                placeholder="例: RSOP S7-5 候補日程"
                className="my-4"
              />

              あなたは誰？
              <div className="my-4">
                <Select onValueChange={setCreatorUserId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="名前を選択（省略可）" />
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
                {creatorUserId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    選択した候補日は全て ○ で自動登録されます
                  </p>
                )}
              </div>

              候補日を選択（複数可）
              <div className="my-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        selectedDates.length === 0 && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDates.length > 0
                        ? `${selectedDates.length}日選択済み`
                        : "日付を選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => setSelectedDates(dates ?? [])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDates.length > 0 && (
                <div className="mb-4 space-y-1">
                  {selectedDates.map((d) => (
                    <div
                      key={format(d, "yyyy-MM-dd")}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{format(d, "M月d日(eee)", { locale: undefined })}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground ml-2"
                        onClick={() => toggleDate(d)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={selectedDates.length === 0}>
                  作成する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

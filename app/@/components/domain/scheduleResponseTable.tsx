import { useState } from "react";
import { ScheduleCandidate, ScheduleResponse, User } from "~/schema/db";
import { format, parseISO } from "date-fns";

type Status = "ok" | "maybe" | "ng" | "none";

const STATUS_CYCLE: Status[] = ["ok", "maybe", "ng"];

const statusLabel: Record<Status, string> = {
  ok: "○",
  maybe: "△",
  ng: "✗",
  none: "?",
};

function buttonClass(status: Status, isMe: boolean): string {
  if (!isMe) {
    const base = "w-9 h-9 rounded-full font-bold text-sm cursor-default";
    if (status === "ok") return `${base} bg-green-600 text-white`;
    if (status === "maybe") return `${base} bg-yellow-500 text-white`;
    if (status === "ng") return `${base} bg-red-600 text-white`;
    return `${base} bg-muted text-muted-foreground`;
  }
  // editable
  const base = "w-9 h-9 rounded-full font-bold text-sm cursor-pointer hover:opacity-80 transition-colors";
  if (status === "ok") return `${base} bg-green-600 text-white`;
  if (status === "maybe") return `${base} bg-yellow-500 text-white`;
  if (status === "ng") return `${base} bg-red-600 text-white`;
  // none + editable: dashed border to signal "tap me"
  return `${base} border-2 border-dashed border-muted-foreground text-muted-foreground bg-transparent`;
}

type Props = {
  candidates: ScheduleCandidate[];
  users: User[];
  responses: ScheduleResponse[];
  currentUserId: number | null;
};

export default function ScheduleResponseTable({
  candidates,
  users,
  responses,
  currentUserId,
}: Props) {
  const initialStatuses = (): Record<number, Status> => {
    const map: Record<number, Status> = {};
    for (const c of candidates) {
      const existing = responses.find(
        (r) => r.candidate_id === c.id && r.user_id === currentUserId
      );
      map[c.id] = (existing?.status as Status) ?? "none";
    }
    return map;
  };

  const [myStatuses, setMyStatuses] = useState<Record<number, Status>>(
    initialStatuses
  );

  const cycleStatus = (candidateId: number) => {
    setMyStatuses((prev) => {
      const current = prev[candidateId] ?? "none";
      const idx = STATUS_CYCLE.indexOf(current as "ok" | "maybe" | "ng");
      const next =
        idx === -1
          ? "ok"
          : STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...prev, [candidateId]: next };
    });
  };

  const getStatus = (userId: number, candidateId: number): Status => {
    if (userId === currentUserId) return myStatuses[candidateId] ?? "none";
    const r = responses.find(
      (r) => r.user_id === userId && r.candidate_id === candidateId
    );
    return r?.status ?? "none";
  };

  const countOk = (candidateId: number) =>
    users.filter((u) => getStatus(u.id, candidateId) === "ok").length;

  return (
    <>
      {currentUserId !== null &&
        candidates.map((c) => (
          <input
            key={c.id}
            type="hidden"
            name={`status_${c.id}`}
            value={myStatuses[c.id] ?? "none"}
          />
        ))}

      {currentUserId !== null && (
        <p className="text-xs text-muted-foreground mb-3">
          タップで <span className="text-green-500 font-bold">○</span> →{" "}
          <span className="text-yellow-500 font-bold">△</span> →{" "}
          <span className="text-red-500 font-bold">✗</span> と切り替えられます
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 w-20"></th>
              {candidates.map((c) => (
                <th key={c.id} className="p-2 text-center min-w-[60px]">
                  {format(parseISO(c.date), "M/d")}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(c.date), "EEE")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-2 font-medium">{user.name}</td>
                {candidates.map((c) => {
                  const isMe = user.id === currentUserId;
                  const status = getStatus(user.id, c.id);
                  return (
                    <td key={c.id} className="p-2 text-center">
                      <button
                        type="button"
                        disabled={!isMe}
                        onClick={() => cycleStatus(c.id)}
                        className={buttonClass(status, isMe)}
                      >
                        {statusLabel[status]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-border font-semibold">
              <td className="p-2 text-muted-foreground text-xs">○の数</td>
              {candidates.map((c) => (
                <td key={c.id} className="p-2 text-center text-green-500">
                  {countOk(c.id)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span><span className="text-green-500 font-bold">○</span> 参加できる</span>
        <span><span className="text-yellow-500 font-bold">△</span> 未定</span>
        <span><span className="text-red-500 font-bold">✗</span> 参加できない</span>
      </div>
    </>
  );
}

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useState } from "react";

type Props = {
  defaultDate: Date;
  defaultName: string;
  defaultBBChanges: {
    userId: number;
    userName: string;
    value: number | null;
  }[];
};

export default function GameFormInputs({
  defaultDate,
  defaultName,
  defaultBBChanges,
}: Props) {
  const [date, setDate] = useState(defaultDate);
  return (
    <>
      <Input
        name="game_name"
        defaultValue={defaultName}
        placeholder="RSOP S1-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate ?? new Date());
            }}
            initialFocus
          />
        </PopoverContent>
        <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
      </Popover>
      {defaultBBChanges.map((bbChange) => {
        return (
          <div key={bbChange.userId}>
            {bbChange.userName}
            <Input
              name={"bb_changes_" + bbChange.userId}
              defaultValue={bbChange.value ?? ""}
              placeholder="BB"
            />
          </div>
        );
      })}
      <Button type="submit" name="_action" value={"update"}>
        Submit
      </Button>
    </>
  );
}

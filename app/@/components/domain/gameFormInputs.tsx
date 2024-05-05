import { Button } from "~/@/components/ui/button";
import { Calendar } from "~/@/components/ui/calendar";
import { Input } from "~/@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/@/components/ui/popover";
import { cn } from "~/@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Season } from "~/schema/db";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  defaultDate: Date;
  defaultName: string;
  defaultSeason: number;
  seasons: Season[];
  defaultBBChanges: {
    userId: number;
    userName: string;
    value: number | null;
  }[];
};

export default function GameFormInputs({
  defaultDate,
  defaultName,
  defaultSeason,
  seasons,
  defaultBBChanges,
}: Props) {
  const [date, setDate] = useState(defaultDate);
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Register new game</CardTitle>
          <Select defaultValue={defaultSeason.toString()} name="season">
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
        </div>
      </CardHeader>
      <CardContent>
        Game Name
        <Input
          name="game_name"
          defaultValue={defaultName}
          placeholder="RSOP S1-1"
          className="my-4"
        />
        Game Date
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal my-4",
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
            <div key={bbChange.userId} className="my-2">
              {bbChange.userName}
              <Input
                name={"bb_changes_" + bbChange.userId}
                defaultValue={bbChange.value ?? ""}
                placeholder="BB"
              />
            </div>
          );
        })}
        <div className="flex justify-end">
          <Button
            type="submit"
            name="_action"
            value={"update"}
            className="mt-3 "
          >
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

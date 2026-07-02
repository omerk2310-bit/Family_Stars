import { useMemo } from "react";
import { getWeekRange } from "../utils/dateRange";
import { useToday } from "./useToday";

export function useWeekRange() {
  const today = useToday();
  return useMemo(() => getWeekRange(today), [today]);
}

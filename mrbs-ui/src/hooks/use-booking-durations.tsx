import { Dayjs } from "dayjs";
import { useMemo } from "react";
import { UserRoleLevel } from "@/models/user";

// Return correct list of durations based on the user's role and the start time.
export function useBookingDuration(
  watchedStartTime: Dayjs | undefined,
  gridStartTime: Dayjs,
  userLevel: number | undefined,
  TOTAL_SLOTS: number = 36,
) {
  const baseDurationOptions = [1, 2, 3, 4, 5, 6];
  // console.log(gridStartTime);

  return useMemo(() => {
    if (!watchedStartTime) return [];

    const diffInMinutes = watchedStartTime.diff(gridStartTime, 'minute');
    const currentSlotIndex = Math.floor(diffInMinutes / 30);
    const slotsRemaining = TOTAL_SLOTS - currentSlotIndex;

    // If Admin, show everything until 2 AM. Otherwise, cap at 3 hours (6 slots).
    if (userLevel === UserRoleLevel.Admin) {
      return Array.from({ length: slotsRemaining }, (_, i) => i + 1);
    }

    return baseDurationOptions.filter(d => d <= slotsRemaining);
  }, [watchedStartTime, gridStartTime, userLevel, TOTAL_SLOTS]);
}

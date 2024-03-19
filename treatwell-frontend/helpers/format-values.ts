export const parseSlotNumber = (inputValue: string) => {
  const number = parseInt(inputValue, 10);
  // Assume slots per day is limited from 1 to 32 (8 hours by 15 minutes)
  if (Number.isNaN(number) || number < 1) {
    return 1;
  } else if (number > 32) {
    return 32;
  }
  return number;
};

export const formatDate = (date: Date) => {
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};
export function translateSlotsToHours(slots: number[]): string[] {
  const startHour = 9; // Start time at 9:00 AM
  const minutesPerSlot = 15;
  const breakStartSlot = 16; // The 16th slot is 13:00 - 13:15, which is the start of the break

  // Convert a slot number to a Date object, adjusting for the break time
  const slotToDate = (slot: number): Date => {
    let hoursOffset = Math.floor(((slot - 1) * minutesPerSlot) / 60);
    let minutesOffset = ((slot - 1) * minutesPerSlot) % 60;

    // If the slot is after the break, adjust the hour by 1
    if (slot > breakStartSlot) hoursOffset += 1;

    const date = new Date();
    date.setHours(startHour + hoursOffset, minutesOffset, 0, 0);
    return date;
  };

  // Group consecutive slots
  let ranges: { start: number; end: number }[] = [];
  slots.forEach((slot) => {
    if (ranges.length > 0 && slot === ranges[ranges.length - 1].end + 1) {
      ranges[ranges.length - 1].end = slot; // Extend current range
    } else {
      ranges.push({ start: slot, end: slot }); // New range
    }
  });

  // Convert slot ranges to formatted time ranges
  return ranges.map(({ start, end }) => {
    const startTime = slotToDate(start);
    const endTime = slotToDate(end + 1); // Get the end time by moving to the next slot

    const formatTime = (date: Date) =>
      `${date.getHours()}h${String(date.getMinutes()).padStart(2, "0")}`;
    return `${formatTime(startTime)}->${formatTime(endTime)}`;
  });
}

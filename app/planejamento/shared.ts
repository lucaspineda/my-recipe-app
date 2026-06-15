export type MealSlotKey = 'cafe' | 'almoco' | 'jantar';

export interface PlannedMealSlot {
  recipeId: string;
  recipeTitle: string;
  servings: number;
  note?: string | null;
  addedFrom?: 'recipe-page' | 'my-recipes';
  createdAt?: any;
  updatedAt?: any;
}

export interface MealPlanDay {
  cafe: PlannedMealSlot | null;
  almoco: PlannedMealSlot | null;
  jantar: PlannedMealSlot | null;
}

export interface MealPlanWeek {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  slots: Record<string, MealPlanDay>;
  createdAt?: any;
  updatedAt?: any;
}

export const MEAL_SLOT_ORDER: MealSlotKey[] = ['cafe', 'almoco', 'jantar'];

export const MEAL_SLOT_LABELS: Record<MealSlotKey, string> = {
  cafe: 'Café',
  almoco: 'Almoço',
  jantar: 'Jantar',
};

const WEEKDAY_LABELS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export const formatWeekdayLabel = (dateKey: string) => {
  const date = fromDateKey(dateKey);
  const weekdayLabel = WEEKDAY_LABELS[date.getDay()] || '';

  return weekdayLabel ? `${weekdayLabel.charAt(0).toUpperCase()}${weekdayLabel.slice(1)}` : '';
};

export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const getWeekStartDate = (date = new Date()) => {
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayBasedDay = (normalizedDate.getDay() + 6) % 7;
  normalizedDate.setDate(normalizedDate.getDate() - mondayBasedDay);
  return normalizedDate;
};

export const getWeekEndDate = (weekStartDate: Date) => addDays(weekStartDate, 6);

export const buildEmptyMealPlanDay = (): MealPlanDay => ({
  cafe: null,
  almoco: null,
  jantar: null,
});

export const buildEmptyWeekSlots = (weekStartDate: string) => {
  const startDate = fromDateKey(weekStartDate);
  const slots: Record<string, MealPlanDay> = {};

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const dateKey = toDateKey(addDays(startDate, dayIndex));
    slots[dateKey] = buildEmptyMealPlanDay();
  }

  return slots;
};

export const getMealPlanDocumentId = (userId: string, weekStartDate: string) => `${userId}_${weekStartDate}`;

export const createEmptyMealPlanWeek = (userId: string, weekStartDate: string): Omit<MealPlanWeek, 'id'> => {
  const weekEndDate = toDateKey(getWeekEndDate(fromDateKey(weekStartDate)));

  return {
    userId,
    weekStartDate,
    weekEndDate,
    slots: buildEmptyWeekSlots(weekStartDate),
  };
};

export const formatDayLabel = (dateKey: string) => {
  const date = fromDateKey(dateKey);
  const weekdayLabel = WEEKDAY_LABELS[date.getDay()];
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${weekdayLabel}, ${day}/${month}`;
};

export const formatWeekRangeLabel = (weekStartDate: string, weekEndDate: string) => {
  const startDate = fromDateKey(weekStartDate);
  const endDate = fromDateKey(weekEndDate);
  const startDay = `${startDate.getDate()}`.padStart(2, '0');
  const endDay = `${endDate.getDate()}`.padStart(2, '0');
  const startMonth = `${startDate.getMonth() + 1}`.padStart(2, '0');
  const endMonth = `${endDate.getMonth() + 1}`.padStart(2, '0');
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
};

export const getWeekDayOptions = (weekStartDate: string) => {
  const startDate = fromDateKey(weekStartDate);

  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = toDateKey(addDays(startDate, index));
    return {
      dateKey,
      label: formatWeekdayLabel(dateKey),
    };
  });
};

export const getPlannedMealsCount = (plan?: Pick<MealPlanWeek, 'slots'> | null) => {
  if (!plan) return 0;

  return Object.values(plan.slots).reduce((count, daySlots) => {
    return count + MEAL_SLOT_ORDER.filter((slot) => Boolean(daySlots?.[slot])).length;
  }, 0);
};
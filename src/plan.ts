import planData from './data/plan.json';
import { addDays, type PlainDate } from './date';
import type { PlanDay } from './types';

export interface ScheduledDay {
  date: PlainDate;
  day: PlanDay;
}

export const PLAN = planData as PlanDay[];
export const PLAN_LENGTH = 730;

export function scheduleFor(start: PlainDate): ScheduledDay[] {
  return PLAN.map((day, i) => ({ date: addDays(start, i), day }));
}

export function endDate(start: PlainDate): PlainDate {
  return addDays(start, PLAN_LENGTH - 1);
}

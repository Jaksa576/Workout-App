import { dashboardData, workoutPlans } from "@/lib/mock-data";
import type { DashboardData, WorkoutPlan, WorkoutTemplate } from "@/lib/types";

export async function getDashboardData(): Promise<DashboardData> {
  return dashboardData;
}

export async function getPlans(): Promise<WorkoutPlan[]> {
  return workoutPlans;
}

export async function getPlanById(id: string): Promise<WorkoutPlan | undefined> {
  return workoutPlans.find((plan) => plan.id === id);
}

export async function getTodayWorkout(): Promise<WorkoutTemplate> {
  return dashboardData.todayWorkout;
}


import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function CheckInPage({
  searchParams
}: {
  searchParams: Promise<{ workoutId?: string }>;
}) {
  const { workoutId } = await searchParams;
  const query = workoutId ? `?workoutId=${encodeURIComponent(workoutId)}&step=check-in` : "";

  redirect(`/workout${query}` as Route);
}

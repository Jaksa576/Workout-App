import { redirect } from "next/navigation";
import type { Route } from "next";

export default function TodayPage() {
  redirect("/workout" as Route);
}

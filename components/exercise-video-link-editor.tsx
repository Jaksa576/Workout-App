"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { normalizeExerciseVideoUrl } from "@/lib/validation";
import type { WorkoutTemplate } from "@/lib/types";

type ExerciseVideoLinkEditorProps = {
  workouts: WorkoutTemplate[];
};

type SaveStatus = {
  tone: "success" | "error";
  message: string;
};

type VideoUpdateResult = {
  exercise?: {
    id: string;
    videoUrl: string;
  };
  error?: string;
};

function getInitialVideoLinks(workouts: WorkoutTemplate[]) {
  const videoLinks: Record<string, string> = {};

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      videoLinks[exercise.id] = exercise.videoUrl ?? "";
    }
  }

  return videoLinks;
}

export function ExerciseVideoLinkEditor({ workouts }: ExerciseVideoLinkEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [videoLinks, setVideoLinks] = useState(() => getInitialVideoLinks(workouts));
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({});
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);

  async function handleSave(exerciseId: string) {
    const nextVideoUrl = videoLinks[exerciseId] ?? "";
    const normalizedVideoUrl = normalizeExerciseVideoUrl(nextVideoUrl);

    if (normalizedVideoUrl === null) {
      setStatuses((current) => ({
        ...current,
        [exerciseId]: {
          tone: "error",
          message: "Use a YouTube link, or leave this blank."
        }
      }));
      return;
    }

    setSavingExerciseId(exerciseId);
    setStatuses((current) => ({
      ...current,
      [exerciseId]: {
        tone: "success",
        message: "Saving..."
      }
    }));

    try {
      const response = await fetch(`/api/exercises/${exerciseId}/video`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ videoUrl: normalizedVideoUrl })
      });
      const result = (await response.json()) as VideoUpdateResult;

      if (!response.ok || !result.exercise) {
        throw new Error(result.error ?? "Unable to save video link.");
      }

      setVideoLinks((current) => ({
        ...current,
        [exerciseId]: result.exercise?.videoUrl ?? ""
      }));
      setStatuses((current) => ({
        ...current,
        [exerciseId]: {
          tone: "success",
          message: result.exercise?.videoUrl ? "Video link saved." : "Video link removed."
        }
      }));
      startTransition(() => router.refresh());
    } catch (error) {
      setStatuses((current) => ({
        ...current,
        [exerciseId]: {
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to save video link."
        }
      }));
    } finally {
      setSavingExerciseId(null);
    }
  }

  return (
    <div className="space-y-5">
      {workouts.map((workout) => (
        <div key={workout.id} className="surface-panel">
          <div>
            <p className="text-sm font-semibold text-copy">{workout.name}</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Add a YouTube demo link for any exercise that needs one.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {workout.exercises.map((exercise) => {
              const status = statuses[exercise.id];
              const isSaving = savingExerciseId === exercise.id || isPending;
              const previewVideoUrl = normalizeExerciseVideoUrl(
                videoLinks[exercise.id] ?? ""
              );

              return (
                <div
                  key={exercise.id}
                  className="rounded-3xl border border-border/70 bg-surface px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <label className="flex-1">
                      <span className="text-sm font-semibold text-copy">
                        {exercise.name}
                      </span>
                      <input
                        type="url"
                        value={videoLinks[exercise.id] ?? ""}
                        onChange={(event) =>
                          setVideoLinks((current) => ({
                            ...current,
                            [exercise.id]: event.target.value
                          }))
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="ui-input mt-3 px-3 py-2"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSave(exercise.id)}
                      disabled={isSaving}
                      className="rounded-full bg-hero px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
                    >
                      {savingExerciseId === exercise.id ? "Saving..." : "Save Link"}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    {previewVideoUrl ? (
                      <a
                        href={previewVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent transition hover:text-copy"
                      >
                        Preview video
                      </a>
                    ) : (
                      <p className="text-muted">No video link yet.</p>
                    )}
                    {status ? (
                      <p className={status.tone === "error" ? "text-accent" : "text-success"}>
                        {status.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

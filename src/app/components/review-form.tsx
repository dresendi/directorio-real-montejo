"use client";

import { useActionState, useEffect, useRef } from "react";

import { initialActionState } from "@/app/action-state";
import { addReviewAction } from "@/app/actions";

type ReviewFormProps = {
  providerId: string;
};

export function ReviewForm({ providerId }: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState(addReviewAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4">
      <input type="hidden" name="providerId" value={providerId} />

      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <label className="space-y-2">
          <span className="field-label">Calificación</span>
          <select className="field-input" name="rating" defaultValue="5">
            <option value="5">5 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="2">2 estrellas</option>
            <option value="1">1 estrella</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="field-label">Experiencia</span>
          <textarea
            className="field-input min-h-24"
            name="comment"
            placeholder="Cuéntanos cómo te fue, qué tan rápido atendió y qué tal estuvo la calidad."
          />
        </label>
      </div>

      {(state.errors?.rating || state.errors?.comment || state.errors?.providerId) && (
        <p className="text-sm text-[color:var(--danger)]">
          {state.errors?.providerId ?? state.errors?.rating ?? state.errors?.comment}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm ${
            state.status === "error"
              ? "text-[color:var(--danger)]"
              : state.status === "success"
                ? "text-[color:var(--success)]"
                : "text-[color:var(--muted)]"
          }`}
        >
          {state.message || "Cada vecino puede mantener una reseña actualizada por proveedor."}
        </p>

        <button className="secondary-button" type="submit" disabled={isPending}>
          {isPending ? "Publicando..." : "Publicar reseña"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";

import { initialActionState } from "@/app/action-state";
import { addProviderAction } from "@/app/actions";
import { categories } from "@/lib/directory-catalog";

function FieldMessage({
  error,
  hint,
}: {
  error?: string;
  hint?: string;
}) {
  return (
    <p className={`text-sm ${error ? "text-[color:var(--danger)]" : "text-[color:var(--muted)]"}`}>
      {error ?? hint}
    </p>
  );
}

export function ProviderForm() {
  const [state, formAction, isPending] = useActionState(addProviderAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" encType="multipart/form-data">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="field-label">Nombre del proveedor</span>
          <input className="field-input" name="name" placeholder="Ejemplo: Reparaciones Luis" />
          <FieldMessage error={state.errors?.name} hint="Usa el nombre del negocio o del servicio." />
        </label>

        <label className="space-y-2">
          <span className="field-label">Categoría</span>
          <select className="field-input" name="categoryId" defaultValue="">
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <FieldMessage error={state.errors?.categoryId} />
        </label>
      </div>

      <label className="space-y-2">
        <span className="field-label">Descripción</span>
        <textarea
          className="field-input min-h-28"
          name="description"
          placeholder="¿Qué tipo de trabajo hace bien este proveedor?"
        />
        <FieldMessage
          error={state.errors?.description}
          hint="Menciona especialidades, tiempos de respuesta o por qué lo recomiendan."
        />
      </label>

      <label className="space-y-2">
        <span className="field-label">Foto del proveedor</span>
        <input
          className="field-input"
          type="file"
          name="imageFile"
          accept="image/*"
          capture="environment"
        />
        <FieldMessage
          error={state.errors?.imageUrl}
          hint="Opcional. Puedes tomar una foto con tu camara o elegir una imagen de tu dispositivo. Si no subes nada, se usara la imagen predeterminada."
        />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="space-y-2">
          <span className="field-label">Teléfono</span>
          <input className="field-input" name="phone" placeholder="999 123 4567" />
          <FieldMessage error={state.errors?.phone} />
        </label>

        <label className="space-y-2">
          <span className="field-label">URL de WhatsApp</span>
          <input className="field-input" name="whatsappUrl" placeholder="https://wa.me/529991234567" />
          <FieldMessage error={state.errors?.whatsappUrl} hint="Es opcional, pero ayuda mucho para contactar." />
        </label>

        <label className="space-y-2">
          <span className="field-label">Zona de servicio</span>
          <input
            className="field-input"
            name="serviceArea"
            defaultValue="Real Montejo y sus alrededores"
            placeholder="Real Montejo y colonias cercanas"
          />
          <FieldMessage error={state.errors?.serviceArea} />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {state.message ? (
            <p
              className={`text-sm font-medium ${
                state.status === "success"
                  ? "text-[color:var(--success)]"
                  : "text-[color:var(--danger)]"
              }`}
            >
              {state.message}
            </p>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Los nombres internos y variables siguen en inglés para mantener buenas prácticas.
            </p>
          )}
        </div>

        <button className="primary-button" type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Agregar proveedor"}
        </button>
      </div>
    </form>
  );
}

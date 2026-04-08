import type { ProviderCard as ProviderCardType } from "@/types/directory";
import { formatStars } from "@/lib/provider-directory";
import { ReviewForm } from "@/app/components/review-form";

type ProviderCardProps = {
  provider: ProviderCardType;
  isAuthenticated: boolean;
};

export function ProviderCard({ provider, isAuthenticated }: ProviderCardProps) {
  return (
    <article className="rounded-[1.35rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--panel)]">
          {provider.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.imageUrl}
                alt={`Imagen de ${provider.name}`}
                className="h-40 w-full object-cover"
              />
            </>
          ) : (
            <div className="provider-image-placeholder h-40 w-full">
              <span className="provider-image-icon">▣</span>
              <p className="provider-image-title">Espacio para imagen</p>
              <p className="provider-image-copy">
                Aquí se puede mostrar la foto, logotipo o trabajo realizado del proveedor.
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="category-badge">{provider.category.label}</span>
                <span className="break-anywhere text-[0.82rem] font-medium text-[color:var(--muted)]">
                  Agregado por {provider.createdByName}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="break-anywhere text-lg font-semibold text-[color:var(--ink)]">
                  {provider.name}
                </h3>
                <p className="break-anywhere mt-2 max-w-2xl text-[0.88rem] leading-5 text-[color:var(--muted)]">
                  {provider.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-[1.05rem] bg-[color:var(--panel)] px-3.5 py-2.5 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand)]">
                Rating
              </p>
              <p className="mt-1.5 text-[1.55rem] font-semibold text-[color:var(--ink)]">
                {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : "Nuevo"}
              </p>
              <p className="text-[0.82rem] text-[color:var(--muted)]">
                {provider.reviewCount} reseña{provider.reviewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="info-chip">
              <span className="info-label">Zona</span>
              <span className="info-value break-anywhere">{provider.serviceArea}</span>
            </div>
            <div className="info-chip">
              <span className="info-label">Teléfono</span>
              <span className="info-value break-anywhere">{provider.phone}</span>
            </div>
            <div className="info-chip">
              <span className="info-label">WhatsApp</span>
              <span className="info-value break-anywhere">
                {provider.whatsappUrl ? (
                  <a
                    className="break-anywhere text-[color:var(--brand)] underline decoration-[color:var(--brand)]/30 underline-offset-4"
                    href={provider.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir chat
                  </a>
                ) : (
                  "No disponible"
                )}
              </span>
            </div>
          </div>

          <div className="rounded-[1.15rem] bg-[color:var(--panel)] p-3.5">
            <p className="text-[0.88rem] font-semibold text-[color:var(--ink)]">
              Comentario reciente de un vecino
            </p>
            <p className="break-anywhere mt-1 text-[0.84rem] text-[color:var(--muted)]">
              {provider.latestReview
                ? `${formatStars(provider.latestReview.rating)} por ${provider.latestReview.authorName}`
                : "Todavía no hay reseñas. Sé el primero en calificar a este proveedor."}
            </p>
            {provider.latestReview ? (
              <p className="break-anywhere mt-3 text-[0.84rem] leading-5 text-[color:var(--muted)]">
                {provider.latestReview.comment}
              </p>
            ) : null}
          </div>

          <div>
            {isAuthenticated ? (
              <ReviewForm providerId={provider.id} />
            ) : (
              <div className="rounded-[1.15rem] border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-3.5 text-[0.84rem] leading-5 text-[color:var(--muted)]">
                Inicia sesión para dejar una calificación con estrellas y ayudar a tus vecinos a
                encontrar proveedores confiables.
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

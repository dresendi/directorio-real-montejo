import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { ReviewForm } from "@/app/components/review-form";
import { authOptions } from "@/lib/auth-options";
import { getProviderBySlug } from "@/lib/directory-store";
import { formatStars } from "@/lib/provider-directory";

type ProviderDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const [{ slug }, session] = await Promise.all([params, getServerSession(authOptions)]);
  const providerData = await getProviderBySlug(slug);

  if (!providerData) {
    notFound();
  }

  const { provider, reviews } = providerData;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="content-card">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Link href="/" className="text-sm font-semibold text-[color:var(--brand)]">
              ← Volver al directorio
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="category-badge">{provider.category.label}</span>
              <span className="text-sm text-[color:var(--muted)]">
                Agregado por {provider.createdByName}
              </span>
            </div>
            <h1 className="break-anywhere text-3xl font-semibold text-[color:var(--ink)]">
              {provider.name}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
              {provider.description}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.imageUrl}
                alt={`Imagen de ${provider.name}`}
                className="aspect-square h-full w-full object-cover"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="info-chip">
                <span className="info-label">Rating</span>
                <span className="info-value">
                  {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : "Nuevo"}
                </span>
              </div>
              <div className="info-chip">
                <span className="info-label">Reseñas</span>
                <span className="info-value">{provider.reviewCount}</span>
              </div>
              <div className="info-chip">
                <span className="info-label">Teléfono</span>
                <span className="info-value break-anywhere">{provider.phone}</span>
              </div>
              <div className="info-chip">
                <span className="info-label">Zona</span>
                <span className="info-value break-anywhere">{provider.serviceArea}</span>
              </div>
              <div className="info-chip md:col-span-2 xl:col-span-4">
                <span className="info-label">WhatsApp</span>
                <span className="info-value break-anywhere">
                  {provider.whatsappUrl ? (
                    <a
                      className="text-[color:var(--brand)] underline decoration-[color:var(--brand)]/30 underline-offset-4"
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
          </div>
        </div>
      </section>

      <section className="content-card space-y-5">
        <div className="section-heading">
          <h2 className="section-title">Reseñas de vecinos</h2>
        </div>

        {reviews.length > 0 ? (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      {review.authorName}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">{formatStars(review.rating)}</p>
                  </div>
                  <p className="text-xs text-[color:var(--muted)]">
                    {new Date(review.createdAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <p className="break-anywhere mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  {review.comment}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-4 text-sm text-[color:var(--muted)]">
            Todavía no hay reseñas para este proveedor.
          </div>
        )}

        <div>
          {session?.user?.email ? (
            <ReviewForm providerId={provider.id} />
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-4 text-sm leading-6 text-[color:var(--muted)]">
              Inicia sesión para dejar una calificación con estrellas y ayudar a tus vecinos.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

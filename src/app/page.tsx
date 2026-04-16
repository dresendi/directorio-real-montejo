import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { ProviderCard } from "@/app/components/provider-card";
import { ProviderFilters } from "@/app/components/provider-filters";
import { ProviderForm } from "@/app/components/provider-form";
import { ReviewForm } from "@/app/components/review-form";
import { SignInButton } from "@/app/components/sign-in-button";
import { SignOutButton } from "@/app/components/sign-out-button";
import { authOptions, getEnabledAuthProviders } from "@/lib/auth-options";
import { categories } from "@/lib/directory-catalog";
import { getDirectorySummary, getProviderCards } from "@/lib/directory-store";
import {
  filterProviders,
  formatStars,
  getSearchParamValue,
  sortProvidersByRanking,
  sortProviders,
  type ProviderSort,
} from "@/lib/provider-directory";

type HomePageProps = {
  searchParams: Promise<{
    category?: string | string[];
    query?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const [filters, session, summary, providerCards] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
    getDirectorySummary(),
    getProviderCards(),
  ]);

  const enabledProviders = getEnabledAuthProviders();
  const selectedCategory = getSearchParamValue(filters.category);
  const searchQuery = getSearchParamValue(filters.query);
  const rawSortBy = getSearchParamValue(filters.sort) || "rating";
  const sortBy: ProviderSort =
    rawSortBy === "alphabetical" ||
    rawSortBy === "rating" ||
    rawSortBy === "reviews" ||
    rawSortBy === "recent"
      ? rawSortBy
      : "rating";
  const filteredProviders = sortProviders(
    filterProviders({
      providers: providerCards,
      selectedCategory,
      searchQuery,
    }),
    sortBy,
  );
  const shouldShowTopProviders = !selectedCategory && !searchQuery && !getSearchParamValue(filters.sort);
  const visibleProviders = shouldShowTopProviders
    ? sortProvidersByRanking(providerCards).slice(0, 5)
    : filteredProviders;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
      <section className="hero-panel overflow-hidden">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-[color:var(--brand)] sm:text-sm">
              Recomendaciones confiables entre vecinos
            </span>

            <div className="space-y-3">
              <div className="app-logo-placeholder">
                <div className="app-logo-mark" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://i.imgur.com/aokZndH.png"
                    alt="Logo del Directorio de proveedores de Real Montejo"
                    className="app-logo-image"
                  />
                </div>
                <div className="space-y-1">
                  <p className="app-logo-label">Real Montejo</p>
                  <p className="app-logo-copy">
                    Directorio colaborativo de proveedores recomendados por vecinos.
                  </p>
                </div>
              </div>
              <h1 className="max-w-3xl text-[1.7rem] font-semibold tracking-tight text-[color:var(--ink)] sm:text-[2.2rem]">
                Directorio de proveedores de Real Montejo
              </h1>
              <p className="max-w-2xl text-[0.95rem] leading-6 text-[color:var(--muted)]">
                Una aplicación colaborativa para que los vecinos inicien sesión, publiquen
                proveedores de la zona, los califiquen con estrellas y encuentren rápido las
                mejores opciones por categoría.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-card">
                <span className="metric-value">{summary.providerCount}</span>
                <span className="metric-label">Proveedores publicados</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{summary.reviewCount}</span>
                <span className="metric-label">Reseñas de vecinos</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{summary.topRatedCount}</span>
                <span className="metric-label">Servicios mejor calificados</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{summary.categoryCount}</span>
                <span className="metric-label">Categorías de servicio</span>
              </div>
            </div>
          </div>

          <aside className="w-full max-w-xl space-y-4 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand)] sm:text-sm">
                Acceso
              </p>
              {session?.user?.email ? (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-[color:var(--ink)] sm:text-xl">
                    Bienvenido de nuevo, {session.user.name ?? "Vecino"}
                  </h2>
                  <p className="text-sm leading-6 text-[color:var(--muted)]">
                    Ya iniciaste sesión y puedes publicar proveedores, además de dejar o actualizar
                    tu reseña en cualquier ficha.
                  </p>
                  <SignOutButton />
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[color:var(--ink)] sm:text-xl">
                    Inicia sesión para participar en el directorio
                  </h2>
                  <p className="text-sm leading-6 text-[color:var(--muted)]">
                    Accede con tu cuenta de Google para publicar proveedores y compartir recomendaciones con otros vecinos.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <SignInButton
                      provider="google"
                      disabled={!enabledProviders.includes("google")}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="content-card">
          <div className="section-heading">
            <h2 className="section-title">Mejores Proveedores</h2>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-3 rounded-[1.35rem] bg-[color:var(--panel)] p-4 md:grid-cols-3">
                <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
                <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
                <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
              </div>
            }
          >
            <ProviderFilters
              categoryOptions={categories}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
            />
          </Suspense>

          <form
            action="/"
            method="GET"
            className="hidden"
          >
            <label className="space-y-2">
              <span className="field-label">Buscar</span>
              <input
                className="field-input"
                defaultValue={searchQuery}
                name="query"
                placeholder="Plomero, jardinería, carpintería..."
              />
            </label>

            <label className="space-y-2">
              <span className="field-label">Categoría</span>
              <select className="field-input" defaultValue={selectedCategory} name="category">
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="field-label">Ordenar por</span>
              <select className="field-input" defaultValue={sortBy} name="sort">
                <option value="rating">Mejor rating</option>
                <option value="alphabetical">Alfabético</option>
                <option value="reviews">Más reseñados</option>
                <option value="recent">Más recientes</option>
              </select>
            </label>

            <div className="flex items-end">
              <button className="secondary-button w-full" type="submit">
                Aplicar
              </button>
            </div>
          </form>

          <div className="mt-6 grid gap-4">
            {visibleProviders.length > 0 ? (
              visibleProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isAuthenticated={Boolean(session?.user?.email)}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-7 text-center text-sm text-[color:var(--muted)]">
                No encontramos proveedores con esos filtros. Prueba otra busqueda o categoria.
              </div>
            )}
          </div>

          <div className="hidden">
            {visibleProviders.length > 0 ? (
              visibleProviders.map((provider) => (
                <article
                  key={provider.id}
                  className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]"
                >
                  <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel)]">
                      {provider.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={provider.imageUrl}
                            alt={`Imagen de ${provider.name}`}
                            className="h-56 w-full object-cover"
                          />
                        </>
                      ) : (
                        <div className="provider-image-placeholder h-56 w-full">
                          <span className="provider-image-icon">▣</span>
                          <p className="provider-image-title">Espacio para imagen</p>
                          <p className="provider-image-copy">
                            Aquí se puede mostrar la foto, logotipo o trabajo realizado del proveedor.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="category-badge">{provider.category.label}</span>
                        <span className="text-sm font-medium text-[color:var(--muted)]">
                          Agregado por {provider.createdByName}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-semibold text-[color:var(--ink)]">
                          {provider.name}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                          {provider.description}
                        </p>
                      </div>
                        </div>

                        <div className="rounded-[1.25rem] bg-[color:var(--panel)] px-4 py-3 text-right">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--brand)]">
                            Rating
                          </p>
                          <p className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
                            {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : "Nuevo"}
                          </p>
                          <p className="text-sm text-[color:var(--muted)]">
                            {provider.reviewCount} reseña{provider.reviewCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="info-chip">
                      <span className="info-label">Coverage</span>
                      <span className="info-value">{provider.serviceArea}</span>
                    </div>
                    <div className="info-chip">
                      <span className="info-label">Teléfono</span>
                      <span className="info-value">{provider.phone}</span>
                    </div>
                    <div className="info-chip">
                      <span className="info-label">WhatsApp</span>
                      <span className="info-value">
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

                  <div className="rounded-[1.5rem] bg-[color:var(--panel)] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--ink)]">
                          Comentario reciente de un vecino
                        </p>
                        <p className="text-sm text-[color:var(--muted)]">
                          {provider.latestReview
                            ? `${formatStars(provider.latestReview.rating)} por ${provider.latestReview.authorName}`
                            : "Todavía no hay reseñas. Sé el primero en calificar a este proveedor."}
                        </p>
                      </div>
                    </div>
                    {provider.latestReview ? (
                      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                        {provider.latestReview.comment}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    {session?.user?.email ? (
                      <ReviewForm providerId={provider.id} />
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-4 text-sm leading-7 text-[color:var(--muted)]">
                        Inicia sesión para dejar una calificación con estrellas y ayudar a tus
                        vecinos a encontrar proveedores confiables.
                      </div>
                    )}
                  </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-8 text-center text-[color:var(--muted)]">
                No encontramos proveedores con esos filtros. Prueba otra búsqueda o categoría.
              </div>
            )}
          </div>
        </article>

        <aside className="space-y-6">
          <section className="content-card">
            <div className="section-heading">
              <h2 className="section-title">Agrega un proveedor</h2>
            </div>
            {session?.user?.email ? (
              <ProviderForm />
            ) : (
              <div className="space-y-4 rounded-[1.5rem] bg-[color:var(--panel)] p-5">
                <p className="text-sm leading-7 text-[color:var(--muted)]">
                  El inicio de sesión social ayuda a evitar publicaciones anónimas y permite que
                  cada vecino mantenga una reseña responsable por proveedor.
                </p>
                <div className="flex flex-wrap gap-3">
                  <SignInButton
                    provider="google"
                    disabled={!enabledProviders.includes("google")}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="content-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Categorías</p>
                <h2 className="section-title">Explora por tipo de servicio</h2>
              </div>
            </div>

            <div className="grid gap-3">
              {categories.map((category) => {
                const providerCount = providerCards.filter(
                  (provider) => provider.categoryId === category.id,
                ).length;

                return (
                  <Link
                    key={category.id}
                    href={`/categorias/${category.id}`}
                    className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-3.5 transition hover:-translate-y-0.5 hover:border-[color:var(--brand)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-[0.9rem] font-semibold text-[color:var(--ink)]">
                        {category.label}
                      </h3>
                      <span className="text-[0.8rem] font-medium text-[color:var(--brand)]">
                        {providerCount} publicados
                      </span>
                    </div>
                    <p className="mt-2 text-[0.84rem] leading-5 text-[color:var(--muted)]">
                      {category.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}


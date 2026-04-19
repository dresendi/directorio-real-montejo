import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import { ProviderCard } from "@/app/components/provider-card";
import { ProviderFilters } from "@/app/components/provider-filters";
import { ProviderForm } from "@/app/components/provider-form";
import { SignInButton } from "@/app/components/sign-in-button";
import { SignOutButton } from "@/app/components/sign-out-button";
import { authOptions, getEnabledAuthProviders } from "@/lib/auth-options";
import {
  getDirectoryCategories,
  getDirectorySummary,
  getProviderCards,
} from "@/lib/directory-store";
import {
  filterProviders,
  getSearchParamValue,
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

const whatsappShareUrl =
  "https://wa.me/?text=Directorio%20de%20proveedores%20de%20Real%20Montejo%20https%3A%2F%2Fdirectorio-real-montejo.vercel.app%2F";

export default async function Home({ searchParams }: HomePageProps) {
  const [filters, session, summary, providerCards, categoryOptions] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
    getDirectorySummary(),
    getProviderCards(),
    getDirectoryCategories(),
  ]);

  const enabledProviders = getEnabledAuthProviders();
  const selectedCategory = getSearchParamValue(filters.category);
  const searchQuery = getSearchParamValue(filters.query);
  const rawSortBy = getSearchParamValue(filters.sort) || "recent";
  const activeMongoDbName = process.env.MONGODB_DB_NAME || "real-montejo-directory";
  const hasActiveFilters = Boolean(
    selectedCategory || searchQuery || getSearchParamValue(filters.sort),
  );
  const sortBy: ProviderSort =
    rawSortBy === "alphabetical" ||
    rawSortBy === "rating" ||
    rawSortBy === "reviews" ||
    rawSortBy === "recent"
      ? rawSortBy
      : "recent";

  const filteredProviders = sortProviders(
    filterProviders({
      providers: providerCards,
      selectedCategory,
      searchQuery,
    }),
    sortBy,
  );

  const visibleProviders = hasActiveFilters
    ? filteredProviders
    : sortProviders(providerCards, "recent").slice(0, 5);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
      <section className="hero-panel overflow-hidden">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-share-button"
              >
                <span className="whatsapp-share-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faWhatsapp} />
                </span>
                Compartir por WhatsApp
              </a>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-[1.7rem] font-semibold tracking-tight text-[color:var(--ink)] sm:text-[2.2rem]">
                Directorio de proveedores de Real Montejo
              </h1>
              <p className="max-w-2xl text-[0.95rem] leading-6 text-[color:var(--muted)]">
                Una aplicación colaborativa para que los vecinos inicien sesión, publiquen
                proveedores de la zona, los califiquen con estrellas y encuentren rápido las
                mejores opciones por categoría.
              </p>
              <div className="inline-flex rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-xs font-semibold text-[color:var(--brand-strong)] shadow-sm">
                Base de datos activa: {activeMongoDbName}
              </div>
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
                    Accede con tu cuenta de Google para publicar proveedores y compartir
                    recomendaciones con otros vecinos.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <SignInButton provider="google" disabled={!enabledProviders.includes("google")} />
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
              categoryOptions={categoryOptions}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
            />
          </Suspense>

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
                No se encontró nada.
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
              <ProviderForm categoryOptions={categoryOptions} />
            ) : (
              <div className="space-y-4 rounded-[1.5rem] bg-[color:var(--panel)] p-5">
                <p className="text-sm leading-7 text-[color:var(--muted)]">
                  El inicio de sesión social ayuda a evitar publicaciones anónimas y permite que
                  cada vecino mantenga una reseña responsable por proveedor.
                </p>
                <div className="flex flex-wrap gap-3">
                  <SignInButton provider="google" disabled={!enabledProviders.includes("google")} />
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
              {categoryOptions.map((category) => {
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

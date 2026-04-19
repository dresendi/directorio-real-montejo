import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { connection } from "next/server";

import { ProviderCard } from "@/app/components/provider-card";
import { ProviderFilters } from "@/app/components/provider-filters";
import { authOptions } from "@/lib/auth-options";
import { getDirectorySnapshot } from "@/lib/directory-store";
import { getSearchParamValue, sortProviders, type ProviderSort } from "@/lib/provider-directory";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  await connection();

  const [{ categoryId }, filters, session, snapshot] = await Promise.all([
    params,
    searchParams,
    getServerSession(authOptions),
    getDirectorySnapshot(),
  ]);
  const { providerCards, categoryOptions } = snapshot;

  const category = categoryOptions.find((entry) => entry.id === categoryId);
  const rawSortBy = getSearchParamValue(filters.sort) || "alphabetical";
  const sortBy: ProviderSort =
    rawSortBy === "rating" || rawSortBy === "reviews" || rawSortBy === "recent"
      ? rawSortBy
      : "alphabetical";

  if (!category) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
        <div className="content-card text-sm text-[color:var(--muted)]">
          La categoría solicitada no existe.
        </div>
      </main>
    );
  }

  const categoryProviders = sortProviders(
    providerCards.filter((provider) => provider.categoryId === category.id),
    sortBy,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="content-card">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Link href="/" className="text-sm font-semibold text-[color:var(--brand)]">
              ← Volver al directorio
            </Link>
            <h1 className="text-2xl font-semibold text-[color:var(--ink)] sm:text-3xl">
              {category.label}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              {category.description}
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-3 rounded-[1.35rem] bg-[color:var(--panel)] p-4 sm:grid-cols-[220px]">
                <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
              </div>
            }
          >
            <ProviderFilters showCategoryFilter={false} showSearchInput={false} sortBy={sortBy} />
          </Suspense>
        </div>
      </section>

      <section className="grid gap-4">
        {categoryProviders.length > 0 ? (
          categoryProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isAuthenticated={Boolean(session?.user?.email)}
            />
          ))
        ) : (
          <div className="content-card text-sm text-[color:var(--muted)]">
            Todavía no hay proveedores publicados en esta categoría.
          </div>
        )}
      </section>
    </main>
  );
}

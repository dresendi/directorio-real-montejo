'use client'

import { Suspense, startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ProviderSort } from "@/lib/provider-directory";

type CategoryOption = {
  id: string;
  label: string;
};

type SortOption = {
  label: string;
  value: ProviderSort;
};

type ProviderFiltersProps = {
  categoryOptions?: CategoryOption[];
  searchQuery?: string;
  selectedCategory?: string;
  showCategoryFilter?: boolean;
  showSearchInput?: boolean;
  sortBy: ProviderSort;
  sortOptions?: SortOption[];
};

function ProviderFiltersInner({
  categoryOptions = [],
  searchQuery = "",
  selectedCategory = "",
  showCategoryFilter = true,
  showSearchInput = true,
  sortBy,
  sortOptions = [
    { label: "Mejor rating", value: "rating" },
    { label: "Alfabético", value: "alphabetical" },
    { label: "Más reseñados", value: "reviews" },
    { label: "Más recientes", value: "recent" },
  ],
}: ProviderFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchQuery);
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const currentQueryString = searchParams.toString();

  const updateFilters = useMemo(
    () => (key: "category" | "query" | "sort", value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      const nextQueryString = params.toString();

      if (nextQueryString === currentQueryString) {
        return;
      }

      startTransition(() => {
        router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [currentQueryString, pathname, router, searchParams],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      updateFilters("query", deferredSearchValue.trim());
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [deferredSearchValue, updateFilters]);

  return (
    <div
      className={`grid gap-3 rounded-[1.35rem] bg-[color:var(--panel)] p-4 ${
        showSearchInput && showCategoryFilter
          ? "md:grid-cols-[1.25fr_0.85fr_0.8fr]"
          : "sm:grid-cols-[220px]"
      }`}
    >
      {showSearchInput ? (
        <label className="space-y-2">
          <span className="field-label">Buscar</span>
          <input
            className="field-input"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Plomero, jardinería, carpintería..."
          />
        </label>
      ) : null}

      {showCategoryFilter ? (
        <label className="space-y-2">
          <span className="field-label">Categoría</span>
          <select
            className="field-input"
            value={selectedCategory}
            onChange={(event) => updateFilters("category", event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="space-y-2">
        <span className="field-label">Ordenar por</span>
        <select
          className="field-input"
          value={sortBy}
          onChange={(event) => updateFilters("sort", event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function ProviderFilters(props: ProviderFiltersProps) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-3 rounded-[1.35rem] bg-[color:var(--panel)] p-4 md:grid-cols-3">
          <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
          <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
          <div className="field-input h-[3.2rem] animate-pulse bg-white/80" />
        </div>
      }
    >
      <ProviderFiltersInner {...props} />
    </Suspense>
  );
}

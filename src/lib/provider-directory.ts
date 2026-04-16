import type { ProviderCard } from "@/types/directory";

export type ProviderSort = "alphabetical" | "rating" | "reviews" | "recent";

export function getSearchParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function formatStars(rating: number) {
  const roundedRating = Math.round(rating);
  return "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
}

export function sortProviders(providers: ProviderCard[], sortBy: ProviderSort) {
  return [...providers].sort((left, right) => {
    if (sortBy === "alphabetical") {
      return left.name.localeCompare(right.name, "es-MX", { sensitivity: "base" });
    }

    if (sortBy === "recent") {
      return right.createdAt.localeCompare(left.createdAt);
    }

    if (sortBy === "reviews") {
      return (
        right.reviewCount - left.reviewCount ||
        right.averageRating - left.averageRating ||
        left.name.localeCompare(right.name, "es-MX", { sensitivity: "base" })
      );
    }

    return (
      right.averageRating - left.averageRating ||
      right.reviewCount - left.reviewCount ||
      left.name.localeCompare(right.name, "es-MX", { sensitivity: "base" })
    );
  });
}

export function sortProvidersByRanking(providers: ProviderCard[]) {
  return [...providers].sort((left, right) => {
    return (
      right.averageRating - left.averageRating ||
      right.createdAt.localeCompare(left.createdAt) ||
      left.name.localeCompare(right.name, "es-MX", { sensitivity: "base" })
    );
  });
}

export function filterProviders(input: {
  providers: ProviderCard[];
  selectedCategory?: string;
  searchQuery?: string;
}) {
  const normalizedQuery = (input.searchQuery ?? "").trim().toLowerCase();

  return input.providers.filter((provider) => {
    const matchesCategory = input.selectedCategory
      ? provider.categoryId === input.selectedCategory
      : true;
    const matchesQuery = normalizedQuery
      ? [provider.name, provider.description, provider.serviceArea, provider.category.label]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      : true;

    return matchesCategory && matchesQuery;
  });
}

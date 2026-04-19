import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Collection, ObjectId } from "mongodb";
import { cache } from "react";

import { categories as fallbackCategories, rawCategories, sortCategories } from "@/lib/directory-catalog";
import { getMongoClient, isMongoConfigured } from "@/lib/mongodb";
import {
  defaultProviderImageUrl,
  legacyDefaultProviderImageUrls,
} from "@/lib/provider-images";
import type {
  Category,
  DirectoryStore,
  DirectorySummary,
  ProviderCard,
  StoredCategory,
  StoredProvider,
  StoredReview,
} from "@/types/directory";

const dataDirectoryPath = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDirectoryPath, "directory.json");
const seedAuthorEmail = "equipo@realmontejo.mx";
const demoEmailDomain = "@example.com";
const defaultStore: DirectoryStore = {
  categories: fallbackCategories,
  providers: [],
  reviews: [],
};

let writeQueue = Promise.resolve();

function normalizeWhatsappUrl(phone: string, whatsappUrl: string) {
  const phoneDigits = phone.replace(/\D/g, "");
  const whatsappDigits = whatsappUrl.replace(/\D/g, "");

  const baseDigits = phoneDigits || whatsappDigits;

  if (!baseDigits) {
    return "";
  }

  const normalizedDigits = baseDigits.startsWith("52") ? baseDigits : `52${baseDigits}`;

  return `https://wa.me/${normalizedDigits}`;
}

function isDemoProvider(provider: StoredProvider) {
  return (
    provider.id.startsWith("seed-") ||
    provider.id.startsWith("provider-") ||
    provider.createdByEmail === seedAuthorEmail ||
    provider.createdByEmail.endsWith(demoEmailDomain)
  );
}

function isDemoReview(review: StoredReview, demoProviderIds: Set<string>) {
  return (
    review.id.startsWith("seed-review-") ||
    demoProviderIds.has(review.providerId) ||
    review.authorEmail.endsWith(demoEmailDomain)
  );
}

function normalizeCategories(inputCategories?: StoredCategory[]) {
  let changed = false;
  const mergedCategories = new Map<string, StoredCategory>();

  for (const category of inputCategories ?? []) {
    if (!mergedCategories.has(category.id)) {
      mergedCategories.set(category.id, category);
    } else {
      changed = true;
    }
  }

  for (const category of rawCategories) {
    if (!mergedCategories.has(category.id)) {
      mergedCategories.set(category.id, category);
      changed = true;
    }
  }

  const categories = sortCategories([...mergedCategories.values()]);

  return {
    changed,
    categories,
  };
}

function normalizeStore(store: DirectoryStore) {
  let changed = false;
  const normalizedCategories = normalizeCategories(store.categories);

  if (normalizedCategories.changed) {
    changed = true;
  }

  const categoryIds = new Set(normalizedCategories.categories.map((category) => category.id));
  const seenProviderIds = new Set<string>();
  const demoProviderIds = new Set<string>();
  const providers = (store.providers ?? []).reduce<StoredProvider[]>((result, provider) => {
    if (seenProviderIds.has(provider.id)) {
      changed = true;
      return result;
    }

    seenProviderIds.add(provider.id);

    if (isDemoProvider(provider) || !categoryIds.has(provider.categoryId)) {
      demoProviderIds.add(provider.id);
      changed = true;
      return result;
    }

    const normalizedImageUrl =
      provider.imageUrl && !legacyDefaultProviderImageUrls.includes(provider.imageUrl)
        ? provider.imageUrl
        : defaultProviderImageUrl;
    const normalizedWhatsappUrl = normalizeWhatsappUrl(provider.phone, provider.whatsappUrl);

    if (normalizedImageUrl !== provider.imageUrl) {
      changed = true;
    }

    if (normalizedWhatsappUrl !== provider.whatsappUrl) {
      changed = true;
    }

    result.push({
      ...provider,
      imageUrl: normalizedImageUrl,
      whatsappUrl: normalizedWhatsappUrl,
    });

    return result;
  }, []);

  const activeProviderIds = new Set(providers.map((provider) => provider.id));
  const seenReviewIds = new Set<string>();
  const reviews = (store.reviews ?? []).reduce<StoredReview[]>((result, review) => {
    if (seenReviewIds.has(review.id)) {
      changed = true;
      return result;
    }

    seenReviewIds.add(review.id);

    if (!activeProviderIds.has(review.providerId) || isDemoReview(review, demoProviderIds)) {
      changed = true;
      return result;
    }

    result.push(review);
    return result;
  }, []);

  return {
    changed,
    store: {
      categories: normalizedCategories.categories,
      providers,
      reviews,
    },
  };
}

async function ensureStoreFile() {
  await mkdir(dataDirectoryPath, { recursive: true });

  try {
    await readFile(dataFilePath, "utf8");
  } catch {
    await writeFile(dataFilePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<DirectoryStore> {
  await ensureStoreFile();
  const rawStore = await readFile(dataFilePath, "utf8");
  const normalizedStore = normalizeStore(JSON.parse(rawStore) as DirectoryStore);

  if (normalizedStore.changed) {
    await writeStore(normalizedStore.store);
  }

  return normalizedStore.store;
}

async function writeStore(store: DirectoryStore) {
  await writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
}

async function getMongoDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB_NAME || "real-montejo-directory");
}

function normalizeMongoCategory(category: StoredCategory & { _id?: ObjectId }): StoredCategory {
  return {
    id: category.id,
    label: category.label,
    description: category.description,
  };
}

function normalizeMongoProvider(provider: StoredProvider & { _id?: ObjectId }): StoredProvider {
  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    categoryId: provider.categoryId,
    imageUrl: provider.imageUrl ?? "",
    description: provider.description,
    phone: provider.phone,
    whatsappUrl: provider.whatsappUrl,
    serviceArea: provider.serviceArea,
    createdAt: provider.createdAt,
    createdByName: provider.createdByName,
    createdByEmail: provider.createdByEmail,
  };
}

function normalizeMongoReview(review: StoredReview & { _id?: ObjectId }): StoredReview {
  return {
    id: review.id,
    providerId: review.providerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    authorName: review.authorName,
    authorEmail: review.authorEmail,
  };
}

async function syncMongoCategories(categoriesCollection: Collection<StoredCategory>) {
  for (const category of rawCategories) {
    await categoriesCollection.updateOne(
      { id: category.id },
      { $setOnInsert: category },
      { upsert: true },
    );
  }
}

async function replaceMongoStore(store: DirectoryStore) {
  const database = await getMongoDatabase();
  const categoriesCollection = database.collection<StoredCategory>("categories");
  const providersCollection = database.collection<StoredProvider>("providers");
  const reviewsCollection = database.collection<StoredReview>("reviews");

  await Promise.all([providersCollection.deleteMany({}), reviewsCollection.deleteMany({})]);

  await syncMongoCategories(categoriesCollection);

  if (store.providers.length > 0) {
    await providersCollection.insertMany(store.providers);
  }

  if (store.reviews.length > 0) {
    await reviewsCollection.insertMany(store.reviews);
  }
}

async function readMongoStore(): Promise<DirectoryStore> {
  const database = await getMongoDatabase();
  const categoriesCollection = database.collection<StoredCategory>("categories");
  const providersCollection = database.collection<StoredProvider>("providers");
  const reviewsCollection = database.collection<StoredReview>("reviews");

  await syncMongoCategories(categoriesCollection);

  const [categories, providers, reviews] = await Promise.all([
    categoriesCollection.find({}).toArray(),
    providersCollection.find({}).toArray(),
    reviewsCollection.find({}).toArray(),
  ]);

  const normalizedStore = normalizeStore({
    categories: categories.map(normalizeMongoCategory),
    providers: providers.map(normalizeMongoProvider),
    reviews: reviews.map(normalizeMongoReview),
  });

  return normalizedStore.store;
}

const readDirectoryStore = cache(async () => {
  return isMongoConfigured() ? readMongoStore() : readStore();
});

export async function getDirectoryCategories(): Promise<Category[]> {
  const store = await readDirectoryStore();
  return sortCategories(store.categories);
}

export async function updateStore<T>(
  mutate: (store: DirectoryStore) => Promise<T> | T,
): Promise<T> {
  if (isMongoConfigured()) {
    const store = await readMongoStore();
    const result = await mutate(store);

    await replaceMongoStore(store);

    return result;
  }

  const nextTask = writeQueue.then(async () => {
    const store = await readStore();
    const result = await mutate(store);
    await writeStore(store);
    return result;
  });

  writeQueue = nextTask.then(
    () => undefined,
    () => undefined,
  );

  return nextTask;
}

function getCategoryById(categoryOptions: Category[], categoryId: string) {
  return categoryOptions.find((category) => category.id === categoryId) ?? categoryOptions[0] ?? fallbackCategories[0];
}

function getProviderReviews(reviews: StoredReview[], providerId: string) {
  return reviews
    .filter((review) => review.providerId === providerId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getAverageRating(reviews: StoredReview[]) {
  if (reviews.length === 0) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

function toProviderCard(
  provider: StoredProvider,
  reviews: StoredReview[],
  categoryOptions: Category[],
): ProviderCard {
  const providerReviews = getProviderReviews(reviews, provider.id);

  return {
    ...provider,
    category: getCategoryById(categoryOptions, provider.categoryId),
    averageRating: getAverageRating(providerReviews),
    reviewCount: providerReviews.length,
    latestReview: providerReviews[0] ?? null,
  };
}

export async function getProviderCards() {
  const store = await readDirectoryStore();
  return store.providers.map((provider) => toProviderCard(provider, store.reviews, store.categories));
}

export async function getProviderBySlug(slug: string) {
  const store = await readDirectoryStore();
  const provider = store.providers.find((entry) => entry.slug === slug);

  if (!provider) {
    return null;
  }

  return {
    provider: toProviderCard(provider, store.reviews, store.categories),
    reviews: getProviderReviews(store.reviews, provider.id),
  };
}

export async function getProviderById(providerId: string) {
  const store = await readDirectoryStore();
  const provider = store.providers.find((entry) => entry.id === providerId);

  if (!provider) {
    return null;
  }

  return toProviderCard(provider, store.reviews, store.categories);
}

export async function updateProviderImage(input: {
  providerId: string;
  imageUrl: string;
}) {
  return updateStore(async (store) => {
    const providerIndex = store.providers.findIndex((provider) => provider.id === input.providerId);

    if (providerIndex < 0) {
      throw new Error("Proveedor no encontrado.");
    }

    store.providers[providerIndex] = {
      ...store.providers[providerIndex],
      imageUrl: input.imageUrl,
    };

    return store.providers[providerIndex];
  });
}

export async function getDirectorySummary(): Promise<DirectorySummary> {
  const [providerCards, categoryOptions] = await Promise.all([
    getProviderCards(),
    getDirectoryCategories(),
  ]);
  const reviewCount = providerCards.reduce((sum, provider) => sum + provider.reviewCount, 0);

  return {
    providerCount: providerCards.length,
    reviewCount,
    topRatedCount: providerCards.filter(
      (provider) => provider.reviewCount > 0 && provider.averageRating >= 4.5,
    ).length,
    categoryCount: categoryOptions.length,
  };
}

export async function addProvider(input: {
  name: string;
  categoryId: string;
  imageUrl: string;
  description: string;
  phone: string;
  whatsappUrl: string;
  serviceArea: string;
  createdByName: string;
  createdByEmail: string;
}) {
  return updateStore(async (store) => {
    const provider: StoredProvider = {
      id: randomUUID(),
      slug: createSlug(input.name),
      name: input.name,
      categoryId: input.categoryId,
      imageUrl: input.imageUrl,
      description: input.description,
      phone: input.phone,
      whatsappUrl: input.whatsappUrl,
      serviceArea: input.serviceArea,
      createdAt: new Date().toISOString(),
      createdByName: input.createdByName,
      createdByEmail: input.createdByEmail,
    };

    store.providers.unshift(provider);

    return provider;
  });
}

export async function upsertReview(input: {
  providerId: string;
  rating: number;
  comment: string;
  authorName: string;
  authorEmail: string;
}) {
  return updateStore(async (store) => {
    const existingReviewIndex = store.reviews.findIndex(
      (review) =>
        review.providerId === input.providerId && review.authorEmail === input.authorEmail,
    );

    const review: StoredReview = {
      id: existingReviewIndex >= 0 ? store.reviews[existingReviewIndex].id : randomUUID(),
      providerId: input.providerId,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString(),
      authorName: input.authorName,
      authorEmail: input.authorEmail,
    };

    if (existingReviewIndex >= 0) {
      store.reviews[existingReviewIndex] = review;
    } else {
      store.reviews.unshift(review);
    }

    return review;
  });
}

export function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

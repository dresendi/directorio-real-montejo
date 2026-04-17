import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ObjectId } from "mongodb";

import { categories } from "@/lib/directory-catalog";
import { getMongoClient, isMongoConfigured } from "@/lib/mongodb";
import {
  defaultProviderImageUrl,
  legacyDefaultProviderImageUrls,
} from "@/lib/provider-images";
import type {
  DirectoryStore,
  DirectorySummary,
  ProviderCard,
  StoredProvider,
  StoredReview,
} from "@/types/directory";

const dataDirectoryPath = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDirectoryPath, "directory.json");
const seedAuthorEmail = "equipo@realmontejo.mx";
const demoEmailDomain = "@example.com";
const defaultStore: DirectoryStore = {
  providers: [],
  reviews: [],
};

let writeQueue = Promise.resolve();

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

function normalizeStore(store: DirectoryStore) {
  let changed = false;
  const seenProviderIds = new Set<string>();
  const demoProviderIds = new Set<string>();
  const providers = (store.providers ?? []).reduce<StoredProvider[]>((result, provider) => {
    if (seenProviderIds.has(provider.id)) {
      changed = true;
      return result;
    }

    seenProviderIds.add(provider.id);

    if (isDemoProvider(provider)) {
      demoProviderIds.add(provider.id);
      changed = true;
      return result;
    }

    const normalizedImageUrl =
      provider.imageUrl && !legacyDefaultProviderImageUrls.includes(provider.imageUrl)
        ? provider.imageUrl
        : defaultProviderImageUrl;

    if (normalizedImageUrl !== provider.imageUrl) {
      changed = true;
    }

    result.push({
      ...provider,
      imageUrl: normalizedImageUrl,
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

async function replaceMongoStore(store: DirectoryStore) {
  const database = await getMongoDatabase();
  const providersCollection = database.collection<StoredProvider>("providers");
  const reviewsCollection = database.collection<StoredReview>("reviews");

  await Promise.all([providersCollection.deleteMany({}), reviewsCollection.deleteMany({})]);

  if (store.providers.length > 0) {
    await providersCollection.insertMany(store.providers);
  }

  if (store.reviews.length > 0) {
    await reviewsCollection.insertMany(store.reviews);
  }
}

async function readMongoStore(): Promise<DirectoryStore> {
  const database = await getMongoDatabase();
  const providersCollection = database.collection<StoredProvider>("providers");
  const reviewsCollection = database.collection<StoredReview>("reviews");

  const [providers, reviews] = await Promise.all([
    providersCollection.find({}).toArray(),
    reviewsCollection.find({}).toArray(),
  ]);

  const normalizedStore = normalizeStore({
    providers: providers.map(normalizeMongoProvider),
    reviews: reviews.map(normalizeMongoReview),
  });

  if (normalizedStore.changed) {
    await replaceMongoStore(normalizedStore.store);
  }

  return normalizedStore.store;
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

function getCategoryById(categoryId: string) {
  return categories.find((category) => category.id === categoryId) ?? categories[0];
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

function toProviderCard(provider: StoredProvider, reviews: StoredReview[]): ProviderCard {
  const providerReviews = getProviderReviews(reviews, provider.id);

  return {
    ...provider,
    category: getCategoryById(provider.categoryId),
    averageRating: getAverageRating(providerReviews),
    reviewCount: providerReviews.length,
    latestReview: providerReviews[0] ?? null,
  };
}

export async function getProviderCards() {
  const store = isMongoConfigured() ? await readMongoStore() : await readStore();
  return store.providers.map((provider) => toProviderCard(provider, store.reviews));
}

export async function getProviderBySlug(slug: string) {
  const store = isMongoConfigured() ? await readMongoStore() : await readStore();
  const provider = store.providers.find((entry) => entry.slug === slug);

  if (!provider) {
    return null;
  }

  return {
    provider: toProviderCard(provider, store.reviews),
    reviews: getProviderReviews(store.reviews, provider.id),
  };
}

export async function getProviderById(providerId: string) {
  const store = isMongoConfigured() ? await readMongoStore() : await readStore();
  const provider = store.providers.find((entry) => entry.id === providerId);

  if (!provider) {
    return null;
  }

  return toProviderCard(provider, store.reviews);
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
  const providerCards = await getProviderCards();
  const reviewCount = providerCards.reduce((sum, provider) => sum + provider.reviewCount, 0);

  return {
    providerCount: providerCards.length,
    reviewCount,
    topRatedCount: providerCards.filter(
      (provider) => provider.reviewCount > 0 && provider.averageRating >= 4.5,
    ).length,
    categoryCount: categories.length,
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

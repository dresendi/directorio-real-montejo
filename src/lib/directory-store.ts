import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ObjectId } from "mongodb";

import { categories } from "@/lib/directory-catalog";
import { getMongoClient, isMongoConfigured } from "@/lib/mongodb";
import { defaultProviderImageUrl } from "@/lib/provider-images";
import type {
  DirectoryStore,
  DirectorySummary,
  ProviderCard,
  StoredProvider,
  StoredReview,
} from "@/types/directory";

const dataDirectoryPath = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDirectoryPath, "directory.json");
const legacyDefaultProviderImageUrl =
  "https://upload.wikimedia.org/wikipedia/commons/f/fa/Plumber_at_work.jpg";
const seedAuthorName = "Equipo Directorio Real Montejo";
const seedAuthorEmail = "equipo@realmontejo.mx";
const sampleReviewerNames = [
  "Laura Medina",
  "Carlos Herrera",
  "Sofia Castillo",
  "Miguel Pacheco",
  "Elena Chan",
];

function getSamplePhoneDigits(index: number) {
  return `999${String(1000000 + index).padStart(7, "0")}`;
}

function formatPhone(phoneDigits: string) {
  return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`;
}

function createSeedProvider(categoryId: string, index: number): StoredProvider {
  const category = categories.find((entry) => entry.id === categoryId) ?? categories[0];
  const phoneDigits = getSamplePhoneDigits(index);
  const providerName = `Servicios ${category.label} Real Montejo`;

  return {
    id: `seed-${category.id}`,
    slug: createSlug(providerName),
    name: providerName,
    categoryId: category.id,
    imageUrl: defaultProviderImageUrl,
    description: `${category.description} Atencion disponible en Real Montejo y colonias cercanas, con trato amable y tiempos de respuesta claros.`,
    phone: formatPhone(phoneDigits),
    whatsappUrl: `https://wa.me/52${phoneDigits}`,
    serviceArea: "Real Montejo y sus alrededores",
    createdAt: new Date(Date.UTC(2026, 0, (index % 28) + 1, 15, 0, 0)).toISOString(),
    createdByName: seedAuthorName,
    createdByEmail: seedAuthorEmail,
  };
}

function createSeedReview(providerId: string, categoryId: string, index: number): StoredReview {
  const category = categories.find((entry) => entry.id === categoryId) ?? categories[0];
  const reviewerName = sampleReviewerNames[index % sampleReviewerNames.length];

  return {
    id: `seed-review-${category.id}`,
    providerId,
    rating: index % 4 === 0 ? 5 : 4,
    comment: `Muy buen servicio de ${category.label.toLowerCase()}, puntual y recomendado por vecinos de Real Montejo.`,
    createdAt: new Date(Date.UTC(2026, 1, (index % 28) + 1, 18, 30, 0)).toISOString(),
    authorName: reviewerName,
    authorEmail: `${createSlug(reviewerName)}@example.com`,
  };
}

function createSeedStore(): DirectoryStore {
  const providers = categories.map((category, index) => createSeedProvider(category.id, index));
  const reviews = providers.map((provider, index) =>
    createSeedReview(provider.id, provider.categoryId, index),
  );

  return {
    providers,
    reviews,
  };
}

function hydrateStoreWithSeedData(store: DirectoryStore) {
  let changed = false;
  const seenProviderIds = new Set<string>();
  const providers = store.providers.reduce<StoredProvider[]>((result, provider) => {
    if (seenProviderIds.has(provider.id)) {
      changed = true;
      return result;
    }

    seenProviderIds.add(provider.id);

    if (provider.imageUrl && provider.imageUrl !== legacyDefaultProviderImageUrl) {
      result.push(provider);
      return result;
    }

    changed = true;
    result.push({
      ...provider,
      imageUrl: defaultProviderImageUrl,
    });

    return result;
  }, []);

  const categoriesWithProviders = new Set(providers.map((provider) => provider.categoryId));
  const missingProviders = categories
    .filter((category) => !categoriesWithProviders.has(category.id))
    .map((category, index) => createSeedProvider(category.id, providers.length + index));

  if (missingProviders.length > 0) {
    changed = true;
    providers.push(...missingProviders);
  }

  const seenReviewIds = new Set<string>();
  const reviews = store.reviews.reduce<StoredReview[]>((result, review) => {
    if (seenReviewIds.has(review.id)) {
      changed = true;
      return result;
    }

    seenReviewIds.add(review.id);
    result.push(review);
    return result;
  }, []);
  const reviewedProviderIds = new Set(reviews.map((review) => review.providerId));

  for (const provider of missingProviders) {
    if (reviewedProviderIds.has(provider.id)) {
      continue;
    }

    changed = true;
    reviews.push(createSeedReview(provider.id, provider.categoryId, reviews.length));
  }

  return {
    changed,
    store: {
      providers,
      reviews,
    },
  };
}

const defaultStore: DirectoryStore = createSeedStore();

let writeQueue = Promise.resolve();

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
  const hydratedStore = hydrateStoreWithSeedData(JSON.parse(rawStore) as DirectoryStore);

  if (hydratedStore.changed) {
    await writeStore(hydratedStore.store);
  }

  return hydratedStore.store;
}

async function writeStore(store: DirectoryStore) {
  await writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
}

async function getMongoDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB_NAME || "real-montejo-directory");
}

function normalizeMongoProvider(
  provider: StoredProvider & { _id?: ObjectId },
): StoredProvider {
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

  await Promise.all([
    providersCollection.deleteMany({}),
    reviewsCollection.deleteMany({}),
  ]);

  if (store.providers.length > 0) {
    await providersCollection.insertMany(store.providers);
  }

  if (store.reviews.length > 0) {
    await reviewsCollection.insertMany(store.reviews);
  }
}

async function ensureMongoSeeded() {
  const database = await getMongoDatabase();
  const providersCollection = database.collection<StoredProvider>("providers");
  const reviewsCollection = database.collection<StoredReview>("reviews");

  const providerCount = await providersCollection.countDocuments();

  if (providerCount === 0) {
    await providersCollection.insertMany(defaultStore.providers);
  }

  const reviewCount = await reviewsCollection.countDocuments();

  if (reviewCount === 0) {
    await reviewsCollection.insertMany(defaultStore.reviews);
  }
}

async function readMongoStore(): Promise<DirectoryStore> {
  await ensureMongoSeeded();

  const database = await getMongoDatabase();
  const providersCollection = database.collection<StoredProvider>("providers");
  const reviewsCollection = database.collection<StoredReview>("reviews");

  const [providers, reviews] = await Promise.all([
    providersCollection.find({}).toArray(),
    reviewsCollection.find({}).toArray(),
  ]);

  const hydratedStore = hydrateStoreWithSeedData({
    providers: providers.map(normalizeMongoProvider),
    reviews: reviews.map(normalizeMongoReview),
  });

  if (hydratedStore.changed) {
    await replaceMongoStore(hydratedStore.store);
  }

  return hydratedStore.store;
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

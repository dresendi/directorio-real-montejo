export type AuthProvider = "google";

export type Category = {
  id: string;
  label: string;
  description: string;
};

export type StoredCategory = Category;

export type StoredProvider = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  description: string;
  phone: string;
  whatsappUrl: string;
  serviceArea: string;
  createdAt: string;
  createdByName: string;
  createdByEmail: string;
};

export type StoredReview = {
  id: string;
  providerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
};

export type DirectoryStore = {
  categories: StoredCategory[];
  providers: StoredProvider[];
  reviews: StoredReview[];
};

export type ProviderCard = StoredProvider & {
  category: Category;
  averageRating: number;
  reviewCount: number;
  latestReview: StoredReview | null;
};

export type DirectorySummary = {
  providerCount: number;
  reviewCount: number;
  topRatedCount: number;
  categoryCount: number;
};

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string>;
};

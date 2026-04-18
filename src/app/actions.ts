"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import {
  addProvider,
  getDirectoryCategories,
  getProviderById,
  getProviderCards,
  updateProviderImage,
  upsertReview,
} from "@/lib/directory-store";
import {
  defaultProviderImageUrl,
  maxProviderImageSizeInBytes,
} from "@/lib/provider-images";
import type { ActionState } from "@/types/directory";

function readText(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

function buildWhatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `https://wa.me/${digits}`;
}

async function readProviderImage(formData: FormData) {
  const imageFile = formData.get("imageFile");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return {
      imageUrl: defaultProviderImageUrl,
    };
  }

  if (!imageFile.type.startsWith("image/")) {
    return {
      error: "Selecciona una imagen valida desde tu camara o tu dispositivo.",
    };
  }

  if (imageFile.size > maxProviderImageSizeInBytes) {
    return {
      error: "La imagen es demasiado pesada. Usa una foto menor a 3 MB.",
    };
  }

  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  const imageBase64 = imageBuffer.toString("base64");

  return {
    imageUrl: `data:${imageFile.type};base64,${imageBase64}`,
  };
}

export async function addProviderAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      status: "error",
      message: "Inicia sesion con Google para agregar un proveedor.",
    };
  }

  const name = readText(formData, "name");
  const categoryId = readText(formData, "categoryId");
  const description = readText(formData, "description");
  const phone = readText(formData, "phone");
  const serviceArea = readText(formData, "serviceArea");
  const categoryOptions = await getDirectoryCategories();

  const errors: Record<string, string> = {};
  const imageResult = await readProviderImage(formData);

  if (name.length < 3) {
    errors.name = "Escribe al menos 3 caracteres para el nombre del proveedor.";
  }

  if (!categoryOptions.some((category) => category.id === categoryId)) {
    errors.categoryId = "Selecciona una categoria valida.";
  }

  if (description.length < 20) {
    errors.description = "Agrega una descripcion mas completa de al menos 20 caracteres.";
  }

  if (imageResult.error) {
    errors.imageUrl = imageResult.error;
  }

  if (phone.length < 8) {
    errors.phone = "Agrega un telefono de contacto valido.";
  }

  if (serviceArea.length < 5) {
    errors.serviceArea = "Describe la zona de servicio.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los campos marcados e intentalo de nuevo.",
      errors,
    };
  }

  await addProvider({
    name,
    categoryId,
    imageUrl: imageResult.imageUrl ?? defaultProviderImageUrl,
    description,
    phone,
    whatsappUrl: buildWhatsappUrl(phone),
    serviceArea,
    createdByName: session.user.name ?? "Neighbor",
    createdByEmail: session.user.email,
  });

  revalidatePath("/");

  return {
    status: "success",
    message: "Proveedor agregado correctamente.",
  };
}

export async function updateProviderImageAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      status: "error",
      message: "Inicia sesion para reemplazar la imagen.",
    };
  }

  const providerId = readText(formData, "providerId");
  const imageResult = await readProviderImage(formData);
  const provider = await getProviderById(providerId);

  if (!provider) {
    return {
      status: "error",
      message: "El proveedor no existe o ya no esta disponible.",
    };
  }

  if (provider.createdByEmail !== session.user.email) {
    return {
      status: "error",
      message: "Solo el vecino que agrego este proveedor puede cambiar la imagen.",
    };
  }

  const errors: Record<string, string> = {};

  if (imageResult.error) {
    errors.imageUrl = imageResult.error;
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa la imagen e intentalo de nuevo.",
      errors,
    };
  }

  await updateProviderImage({
    providerId,
    imageUrl: imageResult.imageUrl ?? defaultProviderImageUrl,
  });

  revalidatePath(`/proveedores/${provider.slug}`);

  return {
    status: "success",
    message: "Imagen actualizada correctamente.",
  };
}

export async function addReviewAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      status: "error",
      message: "Inicia sesion para calificar y resenar a un proveedor.",
    };
  }

  const providerId = readText(formData, "providerId");
  const comment = readText(formData, "comment");
  const rating = Number(readText(formData, "rating"));

  const errors: Record<string, string> = {};
  const providers = await getProviderCards();

  if (!providers.some((provider) => provider.id === providerId)) {
    errors.providerId = "El proveedor seleccionado ya no esta disponible.";
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Selecciona una calificacion entre 1 y 5 estrellas.";
  }

  if (comment.length < 12) {
    errors.comment = "Escribe una resena breve de al menos 12 caracteres.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los datos de la resena e intentalo de nuevo.",
      errors,
    };
  }

  await upsertReview({
    providerId,
    rating,
    comment,
    authorName: session.user.name ?? "Neighbor",
    authorEmail: session.user.email,
  });

  revalidatePath("/");

  return {
    status: "success",
    message: "Tu resena ya fue publicada.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { categories } from "@/lib/directory-catalog";
import { addProvider, getProviderCards, upsertReview } from "@/lib/directory-store";
import type { ActionState } from "@/types/directory";

function readText(formData: FormData, fieldName: string) {
  return String(formData.get(fieldName) ?? "").trim();
}

export async function addProviderAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      status: "error",
      message: "Inicia sesión con Google para agregar un proveedor.",
    };
  }

  const name = readText(formData, "name");
  const categoryId = readText(formData, "categoryId");
  const imageUrl = readText(formData, "imageUrl");
  const description = readText(formData, "description");
  const phone = readText(formData, "phone");
  const whatsappUrl = readText(formData, "whatsappUrl");
  const serviceArea = readText(formData, "serviceArea");

  const errors: Record<string, string> = {};

  if (name.length < 3) {
    errors.name = "Escribe al menos 3 caracteres para el nombre del proveedor.";
  }

  if (!categories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Selecciona una categoría válida.";
  }

  if (description.length < 20) {
    errors.description = "Agrega una descripción más completa de al menos 20 caracteres.";
  }

  if (imageUrl && !/^https?:\/\/.+/u.test(imageUrl)) {
    errors.imageUrl = "Usa una URL completa para la imagen, por ejemplo https://sitio.com/foto.jpg.";
  }

  if (phone.length < 8) {
    errors.phone = "Agrega un teléfono de contacto válido.";
  }

  if (serviceArea.length < 5) {
    errors.serviceArea = "Describe la zona de servicio.";
  }

  if (whatsappUrl && !/^https:\/\/wa\.me\/\d{10,15}$/u.test(whatsappUrl)) {
    errors.whatsappUrl = "Usa un enlace de WhatsApp con el formato https://wa.me/521234567890.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los campos marcados e inténtalo de nuevo.",
      errors,
    };
  }

  await addProvider({
    name,
    categoryId,
    imageUrl,
    description,
    phone,
    whatsappUrl,
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

export async function addReviewAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      status: "error",
      message: "Inicia sesión para calificar y reseñar a un proveedor.",
    };
  }

  const providerId = readText(formData, "providerId");
  const comment = readText(formData, "comment");
  const rating = Number(readText(formData, "rating"));

  const errors: Record<string, string> = {};
  const providers = await getProviderCards();

  if (!providers.some((provider) => provider.id === providerId)) {
    errors.providerId = "El proveedor seleccionado ya no está disponible.";
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Selecciona una calificación entre 1 y 5 estrellas.";
  }

  if (comment.length < 12) {
    errors.comment = "Escribe una reseña breve de al menos 12 caracteres.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los datos de la reseña e inténtalo de nuevo.",
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
    message: "Tu reseña ya fue publicada.",
  };
}

"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";

import type { AuthProvider } from "@/types/directory";

const providerLabels: Record<AuthProvider, string> = {
  google: "Google",
};

type SignInButtonProps = {
  provider: AuthProvider;
  disabled?: boolean;
};

export function SignInButton({ provider, disabled = false }: SignInButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          await signIn(provider);
        });
      }}
      className="inline-flex min-w-36 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-[color:var(--brand)] hover:text-[color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {isPending ? "Abriendo..." : `Continuar con ${providerLabels[provider]}`}
    </button>
  );
}

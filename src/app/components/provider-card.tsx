import Link from "next/link";

import type { ProviderCard as ProviderCardType } from "@/types/directory";

type ProviderCardProps = {
  provider: ProviderCardType;
  isAuthenticated?: boolean;
};

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <article className="rounded-[1.35rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
        <div className="overflow-hidden rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--panel)] sm:h-[150px] sm:w-[150px]">
          {provider.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={provider.imageUrl}
                alt={`Imagen de ${provider.name}`}
                className="aspect-square h-full w-full object-cover"
              />
            </>
          ) : (
            <div className="provider-image-placeholder aspect-square h-full w-full">
              <span className="provider-image-icon">□</span>
              <p className="provider-image-title">Espacio para imagen</p>
              <p className="provider-image-copy">
                Aqui se puede mostrar la foto, logotipo o trabajo realizado del proveedor.
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="category-badge">{provider.category.label}</span>
            </div>

            <div className="min-w-0">
              <Link
                href={`/proveedores/${provider.slug}`}
                className="provider-name-link break-anywhere text-[1.28rem] font-semibold text-[color:var(--ink)]"
              >
                {provider.name}
              </Link>
              <p className="break-anywhere mt-2 max-w-2xl text-[0.88rem] leading-5 text-[color:var(--muted)]">
                {provider.description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="info-chip">
              <span className="info-label">Telefono</span>
              <span className="info-value break-anywhere">{provider.phone}</span>
            </div>
            <div className="info-chip">
              <span className="info-label">WhatsApp</span>
              <span className="info-value break-anywhere">
                {provider.whatsappUrl ? (
                  <a
                    className="break-anywhere text-[color:var(--brand)] underline decoration-[color:var(--brand)]/30 underline-offset-4"
                    href={provider.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir chat
                  </a>
                ) : (
                  "No disponible"
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

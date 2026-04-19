type ActionLink = {
  label: string;
  href: string;
  variant?: "default" | "whatsapp";
  external?: boolean;
};

type EssentialService = {
  title: string;
  website: string;
  description?: string;
  phoneLinks: ActionLink[];
  whatsappLinks?: ActionLink[];
  extraLinks?: ActionLink[];
};

const essentialServices: EssentialService[] = [
  {
    title: "CFE (Comisión Federal de Electricidad)",
    website: "https://www.cfe.gob.mx/",
    phoneLinks: [{ label: "071", href: "tel:071" }],
  },
  {
    title: "JAPAY",
    website: "https://japay.yucatan.gob.mx/",
    phoneLinks: [{ label: "9994 450000", href: "tel:+529994450000" }],
    whatsappLinks: [
      {
        label: "WhatsApp",
        href: "https://wa.me/529994450000",
        variant: "whatsapp",
        external: true,
      },
    ],
  },
  {
    title: "TELMEX",
    website: "https://telmex.com/",
    phoneLinks: [{ label: "800 123 2222", href: "tel:+528001232222" }],
    whatsappLinks: [
      {
        label: "WhatsApp",
        href: "https://wa.me/525544542323",
        variant: "whatsapp",
        external: true,
      },
    ],
  },
  {
    title: "PAMPLONA (Recolección de basura)",
    website: "https://www.pamplona.com.mx/",
    whatsappLinks: [
      {
        label: "WhatsApp",
        href: "https://wa.me/529994424681",
        variant: "whatsapp",
        external: true,
      },
    ],
    phoneLinks: [],
  },
  {
    title: "AYUNTATEL",
    website:
      "https://isla.merida.gob.mx/serviciosinternet/participacionciudadana/public/ayuntatel",
    phoneLinks: [
      { label: "070", href: "tel:070" },
      { label: "(999) 924 4000", href: "tel:+529999244000" },
    ],
    extraLinks: [
      {
        label: "App Merida Movil",
        href: "https://play.google.com/store/apps/details?id=app.meridamovil.com&pcampaignid=web_share",
        external: true,
      },
    ],
  },
];

function ActionButton({ link }: { link: ActionLink }) {
  const className =
    link.variant === "whatsapp"
      ? "service-link service-link-whatsapp"
      : "service-link";

  return (
    <a
      href={link.href}
      className={className}
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noreferrer" : undefined}
    >
      {link.label}
    </a>
  );
}

export default function EssentialServicesPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="content-card space-y-3">
        <p className="eyebrow">Servicios Basicos</p>
        <h1 className="section-title">Servicios Basicos</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Desde celular puedes tocar cualquier número para marcar directamente o abrir el sitio
          oficial de cada servicio.
        </p>
      </section>

      <section className="grid gap-4">
        {essentialServices.map((service) => (
          <article key={service.title} className="content-card emergency-card">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-[color:var(--ink)]">{service.title}</h2>
              {service.description ? (
                <p className="text-sm leading-6 text-[color:var(--muted)]">{service.description}</p>
              ) : null}
              <a
                href={service.website}
                target="_blank"
                rel="noreferrer"
                className="service-link service-link-site"
              >
                Abrir sitio oficial
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              {service.phoneLinks.map((phone) => (
                <ActionButton key={phone.href} link={phone} />
              ))}
              {(service.whatsappLinks ?? []).map((whatsapp) => (
                <ActionButton key={whatsapp.href} link={whatsapp} />
              ))}
              {(service.extraLinks ?? []).map((extra) => (
                <ActionButton key={extra.href} link={extra} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

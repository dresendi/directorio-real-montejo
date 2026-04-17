import Link from "next/link";

const contactFormUrl = "https://forms.gle/jtRSPgLbeyvSp2Q28";

export default function ContactPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="content-card space-y-6">
        <div className="space-y-2">
          <p className="eyebrow">Contacto</p>
          <h1 className="section-title">Sugerencias y nuevas categorias</h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Si quieres proponer una mejora, reportar algo o sugerir una nueva categoria para el
            directorio, compartenos tu idea desde nuestro formulario de Google.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-6">
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            El formulario se abrira en una nueva pestana para que puedas enviarnos tus comentarios
            de forma sencilla.
          </p>
          <div className="mt-4">
            <Link
              href={contactFormUrl}
              target="_blank"
              rel="noreferrer"
              className="primary-button inline-flex"
            >
              Abrir formulario de contacto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

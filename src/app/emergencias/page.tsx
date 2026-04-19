const emergencyContacts = [
  {
    title: "Emergencias",
    numbers: [{ label: "911", href: "tel:911" }],
    description: "Atencion inmediata para emergencias generales.",
  },
  {
    title: "Bomberos",
    numbers: [{ label: "999924-92-42", href: "tel:+529999249242" }],
    description: "Apoyo para incendios, fugas y situaciones de rescate.",
  },
  {
    title: "Cruz Roja",
    numbers: [
      { label: "999983-02-27", href: "tel:+529999830227" },
      { label: "999983-03-06", href: "tel:+529999830306" },
    ],
    description: "Atencion medica y traslados de emergencia.",
  },
];

export default function EmergencyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="content-card space-y-3">
        <p className="eyebrow">Emergencias</p>
        <h1 className="section-title">Numeros de Emergencia</h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Desde celular puedes tocar cualquier numero para marcar directamente.
        </p>
      </section>

      <section className="grid gap-4">
        {emergencyContacts.map((contact) => (
          <article key={contact.title} className="content-card emergency-card">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-[color:var(--ink)]">{contact.title}</h2>
              <p className="text-sm leading-6 text-[color:var(--muted)]">{contact.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {contact.numbers.map((number) => (
                <a key={number.href} href={number.href} className="emergency-link">
                  {number.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

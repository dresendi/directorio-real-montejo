import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";

const headingFont = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Directorio de proveedores de Real Montejo",
  description:
    "Collaborative directory for Real Montejo neighbors to publish, rate, and discover trusted local providers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${headingFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="site-nav">
            <Link href="/" className="site-nav-brand">
              Directorio Real Montejo
            </Link>
            <nav className="site-nav-actions">
              <Link href="/contacto" className="secondary-button">
                Contacto
              </Link>
              <a
                href="https://www.paypal.com/donate/?business=AXWAU8ZVVFN4A&no_recurring=0&item_name=Hola%2C+%0ASi+esta+en+tus+manos+aportar+algo+para+mantener+esta+aplicacion+funcionando%2C+te+lo+agradecere+mucho.&currency_code=MXN"
                target="_blank"
                rel="noreferrer"
                className="primary-button"
              >
                Donar con PayPal
              </a>
            </nav>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="site-footer">
            <div className="site-footer-links">
              <Link href="/contacto" className="secondary-button">
                Enviar sugerencias y nuevas categorías
              </Link>
              <a
                href="https://www.paypal.com/donate/?business=AXWAU8ZVVFN4A&no_recurring=0&item_name=Hola%2C+%0ASi+esta+en+tus+manos+aportar+algo+para+mantener+esta+aplicacion+funcionando%2C+te+lo+agradecere+mucho.&currency_code=MXN"
                target="_blank"
                rel="noreferrer"
                className="primary-button"
              >
                Apoyar con PayPal
              </a>
            </div>
            <p className="site-footer-disclaimer">
              Esta página no colecta información personal ni datos de sesiones de Google. El único
              propósito de esta aplicación es mantener una base de datos de proveedores para los
              vecinos de Real Montejo.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

import { FC, ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import ErrorDisplay from "../general/ErrorDisplay";
import { ErrorProvider } from "@/contexts/ErrorContext";
import { useRouter } from "next/router";

// Assuming the import will work with your setup, otherwise you might need to adjust
// how you handle static files or use a different method to import JSON content.
import en from "@/public/locales/en/common.json";
import fr from "@/public/locales/fr/common.json";
import es from "@/public/locales/es/common.json";
import { LocaleContent } from "@/public/locales/locale-content-type";
import { LanguageSwitcher } from "../general/langage-switcher";

const localeFiles: { [key: string]: LocaleContent } = { en, fr, es };

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { locale } = router;
  const [pageTitle, setPageTitle] = useState<string>("");
  const [pageDescription, setPageDescription] = useState<string>("");

  useEffect(() => {
    const localeData = localeFiles[locale as keyof typeof localeFiles];
    if (localeData) {
      setPageTitle(localeData.homepageTitle);
      setPageDescription(localeData.homepageDescription);
    }
  }, [locale]);

  const changeLanguage = (lang: string) => {
    router.push(router.pathname, router.asPath, { locale: lang });
  };

  return (
    <>
      <ErrorProvider>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <nav>
          {/* Language Switch Links */}
          {/* <ul>
            <li onClick={() => changeLanguage("en")}>EN</li>
            <li onClick={() => changeLanguage("fr")}>FR</li>
            <li onClick={() => changeLanguage("es")}>ES</li>
          </ul> */}
          <LanguageSwitcher />
          {/* Your Existing Links */}
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorDisplay />
          {children}
        </main>
      </ErrorProvider>
    </>
  );
};

export default Layout;

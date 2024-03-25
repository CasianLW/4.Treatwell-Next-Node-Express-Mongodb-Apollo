import { useRouter } from "next/router";

export const LanguageSwitcher = () => {
  const router = useRouter();

  const switchLanguage = (language: string) => {
    router.push(router.pathname, router.asPath, { locale: language });
  };

  return (
    <div className="mx-4 mt-1 gap-1 flex">
      <button
        className="hover:text-blue-600"
        onClick={() => switchLanguage("en")}
      >
        EN
      </button>
      <button
        className="hover:text-blue-600"
        onClick={() => switchLanguage("fr")}
      >
        FR
      </button>
      <button
        className="hover:text-blue-600"
        onClick={() => switchLanguage("es")}
      >
        ES
      </button>
    </div>
  );
};

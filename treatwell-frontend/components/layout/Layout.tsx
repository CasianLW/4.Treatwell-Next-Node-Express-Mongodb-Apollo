import { FC, ReactNode } from "react";
import Head from "next/head";
import ErrorDisplay from "../ErrorDisplay";
import { ErrorProvider } from "@/contexts/ErrorContext";

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

const Layout: FC<LayoutProps> = ({
  children,
  title = "Default Title",
  description = "Default description",
}) => {
  return (
    <>
      <ErrorProvider>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <nav>
          <ul>
            <li>
              <a href="/#reservations">Reservations</a>
            </li>
            <li>
              <a href="/#about">About</a>
            </li>
            <li>
              <a href="/#contact">Contact</a>
            </li>
          </ul>
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

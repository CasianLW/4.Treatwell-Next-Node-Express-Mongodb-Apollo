import { FC, ReactNode, useEffect } from "react";
import Head from "next/head";
import ErrorDisplay from "../ErrorDisplay";
import { ErrorProvider, useError } from "@/contexts/ErrorContext";
import { setHandleApolloError } from "@/lib/apolloClient";

type LayoutProps = {
  children: ReactNode;
  title?: string; // Optional title prop for dynamic page titles
  description?: string;
};

const Layout: FC<LayoutProps> = ({
  children,
  title = "Default Title",
  description = "Default descritpion",
}) => {
  return (
    <>
      <ErrorProvider>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="icon" href="/favicon.ico" />
          {/* Add any other head elements here */}
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
        <main>
          <ErrorDisplay />

          {children}
        </main>
      </ErrorProvider>
    </>
  );
};

export default Layout;

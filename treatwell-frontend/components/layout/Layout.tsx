import { FC, ReactNode } from "react";
import Head from "next/head";

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
      <main>{children}</main>
    </>
  );
};

export default Layout;

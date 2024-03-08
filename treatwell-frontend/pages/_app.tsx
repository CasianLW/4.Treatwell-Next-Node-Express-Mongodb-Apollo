// app/_app.tsx
import React from "react";
import { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "../lib/apolloClient";
import Layout from "@/components/layout/Layout";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ApolloProvider client={apolloClient}>
      <Layout description="Barber shop webste" title="Barber reservation">
        <Component {...pageProps} />
      </Layout>
    </ApolloProvider>
  );
};

export default MyApp;

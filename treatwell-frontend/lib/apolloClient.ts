// apolloClient.ts
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
  ApolloLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

// Function to handle errors, placeholder to be overwritten
let handleApolloError: (error: Error) => void = () => {};

// This function allows overwriting the error handler from React components
export const setHandleApolloError = (handler: (error: Error) => void) => {
  handleApolloError = handler;
};

// Error handling link for Apollo Client
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message }) => {
      const error = new Error(`GraphQL error: ${message}`);
      handleApolloError(error);
    });

  if (networkError) {
    handleApolloError(new Error(`Network error: ${networkError.message}`));
  }
});

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri:
    process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || "http://localhost:4000/graphql",
});

// WebSocket link for subscriptions
const wsLink =
  typeof window !== "undefined"
    ? new WebSocketLink({
        uri:
          process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
          "ws://localhost:4000/graphql",
        options: {
          reconnect: true,
        },
      })
    : null;

// Using the split function to route queries to their respective links
const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink, // Use wsLink for subscriptions
      httpLink // Use httpLink for queries and mutations
    )
  : httpLink;

// Combining error link with the split link
const link = from([errorLink, splitLink]);

// Apollo Client instance
const apolloClient = new ApolloClient({
  link: link,
  cache: new InMemoryCache(),
});

export default apolloClient;

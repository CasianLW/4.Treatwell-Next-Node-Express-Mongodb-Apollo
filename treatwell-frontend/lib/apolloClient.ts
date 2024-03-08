import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "localhost:4000";

// Ensure BACKEND_URL starts with http:// or https:// for HttpLink
const httpUri = BACKEND_URL.startsWith("http")
  ? `${BACKEND_URL}/graphql`
  : `http://${BACKEND_URL}/graphql`;

// Replace "http" with "ws" for WebSocket connection and ensure it's ws:// or wss:// for WebSocketLink
const wsUri = BACKEND_URL.startsWith("http")
  ? `ws${BACKEND_URL.substr(4)}/graphql`
  : `ws://${BACKEND_URL}/graphql`;

const httpLink = new HttpLink({
  uri: httpUri,
});

const wsLink =
  typeof window !== "undefined"
    ? new WebSocketLink({
        uri: wsUri,
        options: {
          reconnect: true,
        },
      })
    : undefined;

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
  : httpLink; // Fallback to httpLink if wsLink is not available (e.g., during SSR)

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default apolloClient;

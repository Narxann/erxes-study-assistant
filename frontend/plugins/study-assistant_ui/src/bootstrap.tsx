import * as ReactDOM from 'react-dom/client';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { StrictMode } from 'react';
import { REACT_APP_API_URL } from 'erxes-ui';
import { IndexPage } from './pages/problems/IndexPage';

const apiUrl = (REACT_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const apolloClient = new ApolloClient({
  link: createHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <IndexPage />
    </ApolloProvider>
  </StrictMode>,
);

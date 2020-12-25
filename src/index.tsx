import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
//import '@forevolve/bootstrap-dark/dist/css/bootstrap-dark.css';
//import * as serviceWorker from './serviceWorker';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { Auth0Provider } from "@auth0/auth0-react";
import Content from './app/Content';

ReactDOM.render(
  <Auth0Provider
    domain="30emeciel.eu.auth0.com"
    clientId="OfVR9fU5mxH6OqsV5ziH19xtN3t7e6rv"
    redirectUri={window.location.origin}
    cacheLocation="localstorage"
    useRefreshTokens={true}
>
  <StrictMode>
    <Content />
  </StrictMode>
  </Auth0Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

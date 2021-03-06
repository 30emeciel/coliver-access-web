import { StrictMode } from "react"
import ReactDOM from "react-dom"
//import * as serviceWorker from './serviceWorker';
//import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { Auth0Provider } from "@auth0/auth0-react"
import App from "./app/App"

ReactDOM.render(
  <Auth0Provider
    domain="paxid.eu.auth0.com"
    clientId="0d48PVLBsB3aFRtotDH26s9HW7m0FTrS"
    redirectUri={window.location.origin}
    cacheLocation="localstorage"
    useRefreshTokens={true}
  >
    <StrictMode>
      <App />
    </StrictMode>
  </Auth0Provider>,
  document.getElementById("root")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// serviceWorkerRegistration.unregister();

import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useEffect, useState } from "react";

import { Button, Container, Jumbotron } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import LoadingButton from "src/core/LoadingButton";
import firebase from "src/core/firebase_config";
import OnBoarding from "./PresenceCalendar/OnBoarding";
import Content from "./app/Content";

const auth0_options = {
  scope: "openid profile email",
};

const Authentication = () => {
  const {
    user,
    loginWithRedirect,
    isLoading,
    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();
  const [
    firebaseAuthUser,
    firebaseAuthIsloading,
    firebaseAuthError,
  ] = useAuthState(firebase.auth());
  const [auth0Token, setAuth0Token] = useState<string | null>(null);

  const [newAccountMode, setNewAccountMode] = useState<boolean>(false)

  useEffect(() => {
    if (!user) {
      return;
    }
    getAccessTokenSilently(auth0_options).then((auth0_token) =>
      setAuth0Token(auth0_token)
    );
  }, [user, getAccessTokenSilently]);

  useEffect(() => {
    if (firebaseAuthIsloading) {
      //wait firebase to be ready
      return;
    }

    if (firebaseAuthUser) {
      // if user is already authenticated, nothing to do
      return;
    }

    if (!user || !auth0Token) {
      //auth0 not ready yet, stop here and wait
      return;
    }

    // exchange auth0 token to firebase auth token
    axios
      .post(
        "https://europe-west3-trentiemeciel.cloudfunctions.net/create_session",
        { access_token: auth0Token }
      )
      .then((exchange_token_response) =>
        firebase
          .auth()
          .signInWithCustomToken(exchange_token_response.data.firebase_token)
      );
  }, [firebaseAuthUser, firebaseAuthIsloading, user, auth0Token]);

  if (!isAuthenticated || !firebaseAuthUser) {
    return (
      <Container>
        <Jumbotron>
          <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
          <h2 className="header">
            L'application de gestion des présences au 30ème Ciel. Fait avec ❤.
          </h2>
          <hr />
          <LoadingButton
            isLoading={
              (isAuthenticated && !firebaseAuthUser) ||
              isLoading ||
              firebaseAuthIsloading
            }
            onClick={() => loginWithRedirect(auth0_options)}
          >
            Continue with 30ème Ciel SSO
          </LoadingButton>
          ;
          <LoadingButton
            isLoading={
              (isAuthenticated && !firebaseAuthUser) ||
              isLoading ||
              firebaseAuthIsloading
            }
            onClick={() => setNewAccountMode(true)}
          >
            Je suis nouveau, je veux créer mon compte
          </LoadingButton>
          {firebaseAuthError && (
            <div>
              Error with Firebase Auth: {JSON.stringify(firebaseAuthError)}
            </div>
          )}
        </Jumbotron>
      </Container>
    );
  } else if (newAccountMode) {
    return <OnBoarding />
  }
  else {
    return <Content/>;
  }
};

export default Authentication;

import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useDebugValue, useEffect, useState } from "react";
import { useAuthState as useFirebaseAuthState } from "react-firebase-hooks/auth";
import { useDocument, useDocumentData } from "react-firebase-hooks/firestore";
import firebase from "src/core/firebase_config";

const auth0_options = {
  scope: "openid profile email",
};

export enum UserStates {
  Authenticated = "AUTHENTICATED",
  Registered = "REGISTERED",
  Confirmed = "CONFIRMED",
}

export interface User {
  sub: string
  state?: UserStates
  picture?: string
}

const useUser = () => {
  const {
    user: auth0User,
    isLoading: auth0IsLoading,
//    isAuthenticated,
    getAccessTokenSilently,
    error: auth0Error
  } = useAuth0();
  const [
    firebaseAuthUser,
    firebaseAuthIsloading,
    firebaseAuthError,
  ] = useFirebaseAuthState(firebase.auth());

  const [auth0Token, setAuth0Token] = useState<string | null>(null);
  

  useEffect(() => {
    if (auth0IsLoading || !auth0User) {
      return;
    }
    getAccessTokenSilently(auth0_options).then((auth0_token) =>
      setAuth0Token(auth0_token)
    );
  }, [auth0IsLoading, auth0User, getAccessTokenSilently]);

  
  useEffect(() => {
    if (firebaseAuthIsloading) {
      //wait firebase to be ready
      return;
    }

    if (firebaseAuthUser) {
      // if user is already authenticated, nothing to do
      return;
    }

    if (!auth0User || !auth0Token) {
      //auth0 not ready yet, stop here and wait
      return;
    }

    // exchange auth0 token to firebase auth token
    axios
      .post(
        "https://europe-west3-trentiemeciel.cloudfunctions.net/auth0-firebase-token-exchange",
        { access_token: auth0Token }
      )
      .then((exchange_token_response) =>
        firebase
          .auth()
          .signInWithCustomToken(exchange_token_response.data.firebase_token)
      );
  }, [firebaseAuthUser, firebaseAuthIsloading, auth0User, auth0Token]);

  const [userDocRef, setUserDocRef] = useState<firebase.firestore.DocumentReference>();

  useEffect(() => {
    if (!firebaseAuthUser) {
      return;
    }

    setUserDocRef(firebase.firestore().doc(`users/${firebaseAuthUser.uid}`));
  }, [firebaseAuthUser]);

  const [userDoc, isUserDocLoading, userDocError] = useDocumentData<User>(userDocRef);
  const [isUserLoading, setIsUserLoading] = useState(true);
  useEffect(
    () => { 
      setIsUserLoading(auth0IsLoading || firebaseAuthIsloading || isUserDocLoading)
    },
    [auth0IsLoading, firebaseAuthIsloading, isUserDocLoading]
  );
  
  const ret = {isLoading: isUserLoading, isAuthenticated: auth0User != null && firebaseAuthUser != null, userDetails: userDoc, docRef: userDocRef, error: auth0Error || firebaseAuthError || userDocError}
  useDebugValue(ret)
  return ret;
};
export default useUser;

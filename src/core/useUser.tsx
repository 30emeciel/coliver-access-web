import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument, useDocumentData } from "react-firebase-hooks/firestore";
import firebase from "src/core/firebase_config";

const auth0_options = {
  scope: "openid profile email",
};

export enum UserStates {
  Registered,
  Validated,
}

export interface User {
  uid: string
  state?: UserStates
}

const useUser = () => {
  const {
    user,
    isLoading,
//    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();
  const [
    firebaseAuthUser,
    firebaseAuthIsloading,
//    firebaseAuthError,
  ] = useAuthState(firebase.auth());
  const [auth0Token, setAuth0Token] = useState<string | null>(null);

  const [isUserLoading, setIsUserLoading] = useState(true);

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

  const [userDocRef, setUserDocRef] = useState<firebase.firestore.DocumentReference | null>(null);

  useEffect(() => {
    if (!firebaseAuthUser) {
      return;
    }

    setUserDocRef(firebase.firestore().doc(`users/${firebaseAuthUser.uid}`));
  }, [firebaseAuthUser]);

  const [userDoc, isUserDocLoading, userDocError] = useDocumentData<User>(userDocRef);

  useEffect(
    () =>
      setIsUserLoading(isLoading || firebaseAuthIsloading || isUserDocLoading),
    [isLoading, firebaseAuthIsloading, isUserDocLoading]
  );


  return [isUserLoading, userDoc] as [boolean, User | undefined];
};
export default useUser;

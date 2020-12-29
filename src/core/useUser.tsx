import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useDebugValue, useEffect, useState } from "react";
import { useAuthState as useFirebaseAuthState } from "react-firebase-hooks/auth";
import { useDocument, useDocumentData } from "react-firebase-hooks/firestore";
import firebase from "src/core/firebase_config";
import loglevel from 'loglevel';
loglevel.setLevel("debug") 

const auth0_options = {
  scope: "openid profile email",
};

export enum UserStates {
  Registered = "REGISTERED",
  Confirmed = "CONFIRMED",
}

export interface User {
  sub: string
  name: string
  state?: UserStates
  picture?: string
}

const log = loglevel.getLogger("useUser")
const useUser = () => {
  
  const {
    user: auth0User,
    isLoading: auth0IsLoading,
    isAuthenticated: auth0IsAuthenticated,
    getAccessTokenSilently,
    error: auth0Error
  } = useAuth0();
  const [
    firebaseAuthUser,
    firebaseAuthIsloading,
    firebaseAuthError,
  ] = useFirebaseAuthState(firebase.auth());

  const [auth0Token, setAuth0Token] = useState<string | null>(null);
  const [isLoadingTris, setIsLoadingTris] = useState(true)
  const [auth0isTokenLoading, setAuth0IsTokenLoading] = useState(false)
  useEffect(() => {
    if (auth0IsLoading || !auth0User) {
      return;
    }
    log.debug("getAccessTokenSilently")
    setAuth0IsTokenLoading(true)
    getAccessTokenSilently(auth0_options).then((auth0_token) => {
      log.debug("setAuth0Token")
      setAuth0Token(auth0_token)
      setAuth0IsTokenLoading(false)
    });
  }, [auth0IsLoading, auth0User, getAccessTokenSilently, setAuth0IsTokenLoading]);

  const [firestoreIsTokenLoading, setFirestoreIsTokenLoading] = useState(false)
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

    log.debug("axios post")
    // exchange auth0 token to firebase auth token
    setFirestoreIsTokenLoading(true)
    axios
      .post(
        "https://europe-west3-trentiemeciel.cloudfunctions.net/auth0-firebase-token-exchange",
        { access_token: auth0Token }
      )
      .then((exchange_token_response) => {
        log.debug("firebase auth signInWithCustomToken")        
        firebase
          .auth()
          .signInWithCustomToken(exchange_token_response.data.firebase_token)        
      });
  }, [firebaseAuthUser, firebaseAuthIsloading, auth0User, auth0Token, setFirestoreIsTokenLoading]);

  const [userDocRef, setUserDocRef] = useState<firebase.firestore.DocumentReference>();

  useEffect(() => {
    if (!firebaseAuthUser) {
      return;
    }    
    log.debug("setUserDocRef")
    setUserDocRef(firebase.firestore().doc(`users/${firebaseAuthUser.uid}`));
    setFirestoreIsTokenLoading(false)
  }, [firebaseAuthUser, setUserDocRef, setFirestoreIsTokenLoading]);

  const [userDocSnap, isUserDocLoading, userDocError] = useDocument(userDocRef);  
  const error = auth0Error || firebaseAuthError || userDocError
  const isAuthenticated = auth0IsAuthenticated && firebaseAuthUser != null  
  const isLoadingBis = auth0IsLoading || firebaseAuthIsloading || isUserDocLoading || userDocSnap?.exists === undefined
  const isLoading = auth0IsLoading || auth0isTokenLoading || firestoreIsTokenLoading || firebaseAuthIsloading || isUserDocLoading || (isAuthenticated && !userDocSnap)
  
  useEffect(() => {
    if (error || (isAuthenticated && !userDocSnap) || (userDocSnap?.exists)) {
      setIsLoadingTris(false)
    }
  }, [setIsLoadingTris, error, isAuthenticated, userDocSnap])

  const ret = {
    auth0IsLoading: auth0IsLoading,
    firebaseAuthIsloading: firebaseAuthIsloading,
    isUserDocLoading: isUserDocLoading,
    isLoading: isLoading,
    isLoadingTris: isLoadingTris,
    isAuthenticated: isAuthenticated,
    userSnap: userDocSnap,
    userDataExists: userDocSnap?.exist,
    userData: userDocSnap?.data() as User,
    docRef: userDocRef,
    error: error
  }
  log.debug(`isLoading ${isLoading} isLoadingBis ${isLoadingBis} isLoadingTris: ${isLoadingTris} isAuthenticated: ${isAuthenticated} userDocSnap: ${!!userDocSnap} userDocSnap?.exists: ${userDocSnap?.exists} userDocSnap?.data(): ${!!userDocSnap?.data()} docRef: ${!!userDocRef} error: ${!!error}`)
  useDebugValue(ret)
  return ret;
};
export default useUser;

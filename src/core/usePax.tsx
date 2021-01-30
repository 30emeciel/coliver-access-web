import { useAuth0 } from "@auth0/auth0-react"
import axios from "axios"
import { useDebugValue, useEffect, useState } from "react"
import { useAuthState as useFirebaseAuthState } from "react-firebase-hooks/auth"
import { useDocument } from "react-firebase-hooks/firestore"
import firebase from "src/core/myfirebase"
import loglevel from "src/core/myloglevel"
import { TPax } from "src/models/Pax"
import { login as freshdeskLogin, logout as freshdeskLogout } from "./freshdesk"

const auth0_options = {
  scope: "openid profile email",
}

const log = loglevel.getLogger("useUser")
const useUser = () => {
  const {
    user: auth0User,
    isLoading: auth0IsLoading,
    isAuthenticated: auth0IsAuthenticated,
    getAccessTokenSilently,
    error: auth0Error,
  } = useAuth0()
  const [firebaseAuthUser, firebaseAuthIsLoading, firebaseAuthError] = useFirebaseAuthState(firebase.auth())

  const [auth0Token, setAuth0Token] = useState<string | null>(null)
  const [isLoadingTris, setIsLoadingTris] = useState(true)
  const [auth0isTokenLoading, setAuth0IsTokenLoading] = useState(false)
  useEffect(() => {
    if (auth0IsLoading || !auth0User) {
      return
    }
    log.debug("getAccessTokenSilently")
    setAuth0IsTokenLoading(true)
    getAccessTokenSilently(auth0_options).then((auth0_token) => {
      log.debug("setAuth0Token")
      setAuth0Token(auth0_token)
      setAuth0IsTokenLoading(false)
    })
  }, [auth0IsLoading, auth0User, getAccessTokenSilently, setAuth0IsTokenLoading])

  useEffect(() => {
    if (!auth0Token) {
      return
    }
    freshdeskLogin(auth0Token)
    return () =>  {
      freshdeskLogout()
    }
  }, [auth0Token])
  const [firestoreIsTokenLoading, setFirestoreIsTokenLoading] = useState(false)
  useEffect(() => {
    if (firebaseAuthIsLoading) {
      //wait firebase to be ready
      return
    }

    if (firebaseAuthUser) {
      // if pax is already authenticated, nothing to do
      return
    }

    if (!auth0User || !auth0Token) {
      //auth0 not ready yet, stop here and wait
      return
    }

    log.debug("axios post")
    // exchange auth0 token to firebase auth token
    setFirestoreIsTokenLoading(true)
    axios
      .post("https://europe-west3-trentiemeciel.cloudfunctions.net/auth0-firebase-token-exchange", {
        access_token: auth0Token,
      })
      .then((exchange_token_response) => {
        log.debug("firebase auth signInWithCustomToken")
        firebase.auth().signInWithCustomToken(exchange_token_response.data.firebase_token)
      })
  }, [firebaseAuthUser, firebaseAuthIsLoading, auth0User, auth0Token, setFirestoreIsTokenLoading])

  const [userDocRef, setUserDocRef] = useState<firebase.firestore.DocumentReference>()

  useEffect(() => {
    if (!firebaseAuthUser) {
      return
    }
    log.debug("setUserDocRef")
    setUserDocRef(firebase.firestore().doc(`pax/${firebaseAuthUser.uid}`))
    setFirestoreIsTokenLoading(false)
  }, [firebaseAuthUser, setUserDocRef, setFirestoreIsTokenLoading])

  const [userDocSnap, isUserDocLoading, userDocError] = useDocument(userDocRef)
  const error = auth0Error || firebaseAuthError || userDocError
  const isAuthenticated = auth0IsAuthenticated && firebaseAuthUser != null
  const isLoadingBis = auth0IsLoading || firebaseAuthIsLoading || isUserDocLoading || userDocSnap?.exists === undefined
  const isLoading =
    auth0IsLoading ||
    auth0isTokenLoading ||
    firestoreIsTokenLoading ||
    firebaseAuthIsLoading ||
    isUserDocLoading ||
    (isAuthenticated && !userDocSnap)

  useEffect(() => {
    if (error || (isAuthenticated && !userDocSnap) || userDocSnap?.exists) {
      setIsLoadingTris(false)
    }
  }, [setIsLoadingTris, error, isAuthenticated, userDocSnap])

  const ret = {
    isLoading: isLoading,
    isAuthenticated: isAuthenticated,
    userSnap: isAuthenticated ? userDocSnap : undefined,
    userData: isAuthenticated ? userDocSnap?.data() as TPax : undefined,
    docRef: isAuthenticated ? userDocRef : undefined,
    error: error,
  }
  log.debug(
    `isLoading ${isLoading} isLoadingBis ${isLoadingBis} isLoadingTris: ${isLoadingTris} isAuthenticated: ${isAuthenticated} userDocSnap: ${!!userDocSnap} userDocSnap?.exists: ${
      userDocSnap?.exists
    } userDocSnap?.data(): ${!!userDocSnap?.data()} docRef: ${!!userDocRef} error: ${!!error}`
  )
  useDebugValue(ret)
  return ret
}
export default useUser

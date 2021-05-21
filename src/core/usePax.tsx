import { useAuth0 } from "@auth0/auth0-react"
import axios from "axios"
import { useDebugValue, useEffect, useState } from "react"
import { useAuthState as useFirebaseAuthState } from "react-firebase-hooks/auth"
import { useDocument } from "react-firebase-hooks/firestore"
import firebase from "src/core/myfirebase"
import loglevel from "src/core/myloglevel"
import { TPax, TPaxConverter } from "src/models/Pax"
import { login as freshdeskLogin, logout as freshdeskLogout } from "./freshdesk"
import db from "./db"
import { getEnvOrFail } from "./getEnvOrFail"

const auth0_options = {
  scope: "openid profile email",
}

const FUNCTIONS_HOST = getEnvOrFail("FUNCTIONS_HOST")
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
  useEffect(() =>  {
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
    setFirestoreIsTokenLoading(true);
    (async () => {
      const exchange_token_response = await axios
        .post(`${FUNCTIONS_HOST}/auth0-firebase-token-exchange`, {
          access_token: auth0Token,
        })

      log.debug("firebase auth signInWithCustomToken")
      localStorage.setItem("ERROR_REPORTING_API_KEY", exchange_token_response.data.error_reporting_api_key)
      await firebase.auth().signInWithCustomToken(exchange_token_response.data.firebase_token)
      log.debug("firebase auth signInWithCustomToken DONE")
    })()
  }, [firebaseAuthUser, firebaseAuthIsLoading, auth0User, auth0Token, setFirestoreIsTokenLoading])

  const [userDocRef, setUserDocRef] = useState<firebase.firestore.DocumentReference>()

  useEffect(() => {
    if (!firebaseAuthUser) {
      return
    }
    log.debug("setUserDocRef")
    setUserDocRef(db.doc(`pax/${firebaseAuthUser.uid}`).withConverter(TPaxConverter))
    setFirestoreIsTokenLoading(false)
  }, [firebaseAuthUser, setUserDocRef, setFirestoreIsTokenLoading])

  const [userDocSnap, isUserDocLoading, userDocError] = useDocument(userDocRef)
  const error = auth0Error || firebaseAuthError || userDocError
  const isAuthenticated = auth0IsAuthenticated && firebaseAuthUser != null
  const isLoading =
    auth0IsLoading ||
    auth0isTokenLoading ||
    firestoreIsTokenLoading ||
    firebaseAuthIsLoading ||
    isUserDocLoading ||
    (isAuthenticated && !userDocSnap)

  const ret = {
    isLoading: isLoading,
    isAuthenticated: isAuthenticated,
    userSnap: isAuthenticated ? userDocSnap : undefined,
    userData: isAuthenticated ? userDocSnap?.data() as TPax : undefined,
    docRef: isAuthenticated ? userDocRef : undefined,
    error: error
  }
  log.debug(
    `isLoading ${isLoading} isAuthenticated: ${isAuthenticated} userDocSnap: ${!!userDocSnap} userDocSnap?.exists: ${
      userDocSnap?.exists
    } userDocSnap?.data(): ${!!userDocSnap?.data()} docRef: ${!!userDocRef} error: ${!!error}`
  )
  useDebugValue(ret)
  return ret
}
export default useUser

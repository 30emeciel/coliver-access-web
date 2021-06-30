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
    getAccessTokenSilently,
    error: auth0Error,
  } = useAuth0()
  const [, firebaseAuthIsLoading, firebaseAuthError] = useFirebaseAuthState(firebase.auth())

  const [auth0Token, setAuth0Token] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (auth0IsLoading) {
      return
    }
    if (auth0User) {

      log.debug("getAccessTokenSilently")
      getAccessTokenSilently(auth0_options).then((auth0_token) => {
        log.debug("setAuth0Token")
        freshdeskLogin(auth0_token)
        setAuth0Token(auth0_token)
      })
    }
    else {
      // final state
      setIsLoading(false)
    }
    return () =>  {
      log.debug("freshdeskLogout")
      freshdeskLogout()
    }

  }, [auth0IsLoading, auth0User, getAccessTokenSilently])

  const [paxDocRef, setPaxDocRef] = useState<firebase.firestore.DocumentReference>()

  useEffect(() =>  {
    if (firebaseAuthIsLoading) {
      //wait firebase to be ready
      return
    }

    if (!auth0Token) {
      //auth0 not ready yet, stop here and wait
      return
    }

    log.debug("auth0-firebase-token-exchange POST");
    // exchange auth0 token to firebase auth token
    (async () => {
      const exchange_token_response = await axios
        .post(`${FUNCTIONS_HOST}/auth0-firebase-token-exchange`, {
          access_token: auth0Token,
        })
      log.debug("auth0-firebase-token-exchange DONE");
      localStorage.setItem("ERROR_REPORTING_API_KEY", exchange_token_response.data.error_reporting_api_key)
      log.debug("firebase auth signInWithCustomToken")
      const userCredentials = await firebase.auth().signInWithCustomToken(exchange_token_response.data.firebase_token)
      log.debug("firebase auth signInWithCustomToken DONE")
      const firebaseAuthUser = userCredentials.user
      if (!firebaseAuthUser) {
        throw "!firebaseAuthUser"
      }
      log.debug("setPaxDocRef")
      setPaxDocRef(db.doc(`pax/${firebaseAuthUser.uid}`).withConverter(TPaxConverter))
    })()
  }, [firebaseAuthIsLoading, auth0Token, setPaxDocRef])

  const [paxDocSnap, , paxDocError] = useDocument(paxDocRef)

  useEffect(() => {
    if (!paxDocSnap) {
      return
    }
    if (!paxDocSnap.exists) {
      throw "!userDocSnap.exists"
    }

    //final state
    setIsLoading(false)
  }, [paxDocSnap, setIsLoading])

  const error = auth0Error || firebaseAuthError || paxDocError

  useEffect(() => {
    if (error)
      setIsLoading(false)
  }, [error])

  const paxData = paxDocSnap?.exists ? paxDocSnap?.data() as TPax : undefined
  const isAuthenticated = paxData != undefined

  const ret = {
    isLoading: isLoading,
    isAuthenticated: isAuthenticated,
    paxData: isAuthenticated ? paxDocSnap?.data() as TPax : undefined,
    paxDocRef: isAuthenticated ? paxDocRef : undefined,
    error: error
  }
  log.debug(
    `\
isLoading ${isLoading} \
isAuth0Loading: ${auth0IsLoading} \
isFirebaseAuthLoading: ${firebaseAuthIsLoading} \
isAuthenticated: ${isAuthenticated} \
paxDocSnap: ${!!paxDocSnap} \
paxDocSnap?.exists: ${!!paxDocSnap?.exists} \
paxDocSnap?.data(): ${!!paxDocSnap?.data()} \
paxDocRef: ${!!paxDocRef} \
error: ${!!error}`
  )
  useDebugValue(ret)
  return ret
}
export default useUser

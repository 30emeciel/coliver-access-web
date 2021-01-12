import { Pax } from "./usePax"
import firebase from "src/core/firebase_config"
import React from "react"

export interface TPaxContext {
  isLoading: boolean
  isAuthenticated?: boolean
  doc?: Pax
  ref?: firebase.firestore.DocumentReference
}

const PaxContext = React.createContext<TPaxContext>({ isLoading: true})

export default PaxContext

import { Pax } from "./usePax"
import firebase from "src/core/firebase_config"
import React from "react"

export interface TUserContext {
  isLoading: boolean
  doc?: Pax
  ref?: firebase.firestore.DocumentReference
}

const UserContext = React.createContext<TUserContext>({ isLoading: true })

export default UserContext

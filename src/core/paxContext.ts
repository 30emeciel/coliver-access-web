import { TPax } from "../models/Pax"
import firebase from "src/core/myfirebase"
import React from "react"

export interface TPaxContext {
  isLoading: boolean
  isAuthenticated?: boolean
  doc?: TPax
  ref?: firebase.firestore.DocumentReference
}

const PaxContext = React.createContext<TPaxContext>({ isLoading: true})

export default PaxContext

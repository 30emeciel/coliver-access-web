import {User} from "./useUser"
import firebase from "src/core/firebase_config";
import React from "react";


export interface TUserContext {
  isLoading: boolean
  doc?: User
  ref?: firebase.firestore.DocumentReference 
}

const UserContext = React.createContext<TUserContext>({isLoading: true})

export default UserContext

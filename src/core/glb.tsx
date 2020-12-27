import {User} from "./useUser"
import firebase from "src/core/firebase_config";

interface TGlb {
  isLoading: boolean
  user?: User
  ref?: firebase.firestore.DocumentReference 
}
const glb:TGlb = {isLoading: false};

export default glb;

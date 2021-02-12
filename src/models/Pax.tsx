import admin from "firebase"
import { makePartialData } from "./utils"


export enum TPaxStates {
  Authenticated = "",
  Registered = "REGISTERED",
  Confirmed = "CONFIRMED",
}


export interface TPax {
  sub: string;
  name: string;
  state?: TPaxStates;
  picture?: string;
  isSupervisor?: boolean;
  preregistrationFormEntryUrl?: string;
}

export const TPaxConverter: admin.firestore.FirestoreDataConverter<TPax> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)

    return {
      sub: data.sub,
      name: data.name,
      state: data.state,
      picture: data.picture,
      isSupervisor: data.is_supervisor,
      preregistrationFormEntryUrl: data.preregistration_form_entry_url
    }
  },
  toFirestore: (entity: Partial<TPax>) => {
    return makePartialData({
      // prevent to change pax id
      // sub: entity.sub,
      name: entity.name,
      state: entity.state,
      picture: entity.picture,
      is_supervisor: entity.isSupervisor,
      preregistration_form_entry_url: entity.preregistrationFormEntryUrl
    })
  },
}

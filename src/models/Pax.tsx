import admin from "firebase"
import { DateTime } from "luxon"


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
    return Object.fromEntries(Object.entries({
      // prevent to change pax id
      // sub: entity.sub,
      name: entity.name ?? undefined,
      state: entity.state ?? undefined,
      picture: entity.picture ?? undefined,
      is_supervisor: entity.isSupervisor ?? undefined,
      preregistration_form_entry_url: entity.preregistrationFormEntryUrl ?? undefined
    }).filter(([key, value]) => value !== undefined))
  },
}

import axios from "axios"
import myloglevel from "src/core/myloglevel"

declare function FreshworksWidget(s: string, s2?: any, s3?: any): void

const log = myloglevel.getLogger("freshdesk")



export function login(auth0Token: string) {

  async function authenticateCallback() {
    const exchange_token_response = await axios
      .post("https://europe-west3-trentiemeciel.cloudfunctions.net/freshdesk-token-exchange", {
        access_token: auth0Token,
      })

    FreshworksWidget('authenticate', {
      token: exchange_token_response.data.freshdesk_token,
      callback: authenticateCallback
    });
  }

  authenticateCallback().then(() => log.debug("freshdesk authenticated"))
}

export function logout() {
  FreshworksWidget('logout');
}

export function openTicketForm() {
  FreshworksWidget('open', 'ticketForm');
}

export function open() {
  FreshworksWidget('open');
}


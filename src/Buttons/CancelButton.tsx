import { Button, Space } from "antd"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowCircleLeft,
  faBackspace,
  faDoorClosed,
  faTimes,
  faUndo,
  faWindowClose,
} from "@fortawesome/free-solid-svg-icons"
import React from "react"
import { ButtonProps } from "antd/lib/button"


export default function CancelButton(props:ButtonProps) {
  return <Button {...props}><FontAwesomeIcon icon={faWindowClose} /> Annuler</Button>
}

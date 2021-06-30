import { Button, Space } from "antd"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons"
import React from "react"
import { ButtonProps } from "antd/lib/button"


export default function BackButton(props:ButtonProps) {
  return <Button {...props}><FontAwesomeIcon icon={faArrowCircleLeft} /> Retour</Button>
}

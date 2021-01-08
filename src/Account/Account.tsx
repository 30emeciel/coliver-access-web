import React, { useContext } from "react"
import { Button, ButtonGroup, Container, Form, Spinner, ToggleButton } from "react-bootstrap"
import { useDocumentData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { Pax, PaxStates } from "src/core/usePax"
import { $enum } from "ts-enum-util"

const Account = ({ paxId }: { paxId?: string }) => {
  const paxContext = useContext(PaxContext)
  const paxDocRef = paxId ? db.doc(`pax/${paxId}`) : paxContext.ref!

  const [paxDoc, paxDocIsLoading, paxDocError] = useDocumentData<Pax>(paxDocRef)

  if (!paxDoc) {
    return <Container><Spinner animation="border" /></Container>
  }
  const updateAccount = () => {}

  return (
    <Container>
      <Form>
        <Form.Group controlId="exampleForm.ControlInput1">
          <Form.Label>Name</Form.Label>
          <Form.Control readOnly value={paxDoc.name} />
        </Form.Group>
        <Form.Group controlId="exampleForm.ControlSelect1">
          <Form.Label>State</Form.Label>
          <div className="mb-3">
            <ButtonGroup toggle>
              {$enum(PaxStates).map((value, key, wrappedEnum, index) => (
                <ToggleButton
                  key={index}
                  className="mr-2"
                  type="radio"
                  variant={paxDoc.state === value ? "success" : "secondary"}
                  value={key}
                  checked={paxDoc.state === value}
                  onChange={(e) =>
                    paxDocRef.update({
                      state: $enum(PaxStates).getValueOrThrow(e.currentTarget.value),
                    })
                  }
                >
                  {key}
                </ToggleButton>
              ))}
            </ButtonGroup>
          </div>
        </Form.Group>
        <Form.Group controlId="exampleForm.ControlSelect3">
          <Form.Label>Supervisaire ?</Form.Label>
          <div className="mb-3">
            <ButtonGroup toggle>
              {[true, false].map((value, index) => (
                <ToggleButton
                  key={index}
                  className="mr-2"
                  type="radio"
                  variant={!!paxDoc.isSupervisor === value ? "success" : "secondary"}
                  value={value}
                  checked={!!paxDoc.isSupervisor === value}
                  onChange={(e) => {
                    const d = {
                      isSupervisor: value,
                    }
                    paxDocRef.update(d)
                  }
                  }
                >
                  {value ? "Oui" : "Non"}
                </ToggleButton>
              ))}
            </ButtonGroup>
          </div>
        </Form.Group>
      </Form>
    </Container>
  )
}

export default Account

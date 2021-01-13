import { Form, Input, Button, Checkbox, Row, Radio, Spin } from "antd"
import React, { useContext } from "react"
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
    return <Spin />
  }

  return (
    <>
      <Row>
        <h3>{paxId ? `Compte de ${paxDoc.name}` : "Mon compte"}</h3>
      </Row>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 8 }}>
        <Form.Item label="Name" name="Name" initialValue={paxDoc.name}>
          <Input readOnly/>
        </Form.Item>
        <Form.Item label="State" name="State" initialValue={$enum(PaxStates).getKeyOrThrow(paxDoc.state)}>
          <Radio.Group value={paxDoc.state}>
            {$enum(PaxStates).map((value, key, wrappedEnum, index) => (
              <Radio.Button
                key={index}
                value={key}
                onChange={(e) =>
                  paxDocRef.update({
                    state: $enum(PaxStates).getValueOrThrow(e.target.value),
                  })
                }
              >
                {key}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
        <Form.Item label="Supervisaire ?" name="Supervisaire ?" initialValue={!!paxDoc.isSupervisor}>
          <Radio.Group value={!!paxDoc.isSupervisor}>
            {[true, false].map((value, index) => (
              <Radio.Button
                key={index}
                value={value}
                onChange={(e) => {
                  const d = {
                    isSupervisor: value,
                  }
                  paxDocRef.update(d)
                }}
              >
                {value ? "Oui" : "Non"}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  )
}

export default Account

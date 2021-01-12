import { Form, Input, Button, Checkbox, Row, Radio, Spin } from 'antd';
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
  const updateAccount = () => {}

  return (
    <Row>
      <Form>
        <Form.Item label="Name" name="Name">
          <Input />
        </Form.Item>
        <Form.Item label="State" name="State">
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
        <Form.Item label="Supervisaire ?" name="Supervisaire ?">
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
                  }
                  }
                >
                  {value ? "Oui" : "Non"}
                </Radio.Button>
              ))}
            </Radio.Group>
        </Form.Item>
      </Form>
      </Row>
  )
}

export default Account

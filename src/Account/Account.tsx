import { faUser } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Form, Input, Radio, Row, Space, Spin } from "antd"
import React, { useContext, useState } from "react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TPax, TPaxConverter, TPaxStates } from "src/models/Pax"
import { $enum } from "ts-enum-util"
import Text from "antd/es/typography/Text"

const LoadingFormItem = ({
                           label,
                           name,
                           initialValue,
                           render,
                         }: {
  label: string,
  name: string,
  initialValue: any,
  render: (isLoading: boolean, setIsLoading: (b: boolean) => void) => any
}) => {
  const [isLoading, setIsLoading] = useState(false)

  return <>
    <Form.Item label={label} name={name} initialValue={initialValue}>
      <Space direction="horizontal">
        {render(isLoading, setIsLoading)}
        {isLoading && <Spin size="small" />}
      </Space>
    </Form.Item>

  </>
}
const Account = ({ paxId }: { paxId?: string }) => {
  const paxContext = useContext(PaxContext)
  const paxDocRef = paxId ? db.doc(`pax/${paxId}`).withConverter(TPaxConverter) : paxContext.ref!

  const [paxDoc, paxDocIsLoading, paxDocError] = useDocumentData<TPax>(paxDocRef)

  if (!paxDoc) {
    return <Spin />
  }

  return (
    <>
      <Row>
        <h2><FontAwesomeIcon icon={faUser} /> {paxId ? `Compte de ${paxDoc.name}` : "Mon compte"}</h2>
      </Row>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 8 }}>
        <Form.Item label="Name" name="Name" initialValue={paxDoc.name}>
          <Input readOnly />
        </Form.Item>
        <Form.Item label="Lien vers la préinscription">
          <a target="_blank" href={paxDoc.preregistrationFormEntryUrl}>{paxDoc.preregistrationFormEntryUrl}</a>
        </Form.Item>
        <LoadingFormItem label="State" name="State" initialValue={$enum(TPaxStates).getKeyOrThrow(paxDoc.state)}
                         render={(isLoading, setIsLoading) => <>
                           <Radio.Group disabled={isLoading} buttonStyle="solid" value={paxDoc.state}>
                             {$enum(TPaxStates).map((value, key, wrappedEnum, index) => (
                               <Radio.Button
                                 key={index}
                                 value={value}
                                 onChange={async (e) => {
                                   setIsLoading(true)
                                   await paxDocRef.set({
                                     state: value,
                                   }, { merge: true })
                                   setIsLoading(false)
                                 }}
                               >
                                 {key}
                               </Radio.Button>
                             ))}
                           </Radio.Group>
                         </>
                         }
        />
        <LoadingFormItem label="Supervisaire ?" name="Supervisaire ?" initialValue={!!paxDoc.isSupervisor}
                         render={(isLoading, setIsLoading) => <>
                           <Radio.Group buttonStyle="solid" disabled={isLoading} value={!!paxDoc.isSupervisor}>
                             {[true, false].map((value, index) => (
                               <Radio.Button
                                 key={index}
                                 value={value}
                                 onChange={async (e) => {
                                   setIsLoading(true)
                                   const d = {
                                     isSupervisor: value,
                                   }
                                   await paxDocRef.set(d, { merge: true })
                                   setIsLoading(false)
                                 }}
                               >
                                 {value ? "Oui" : "Non"}
                               </Radio.Button>
                             ))}
                           </Radio.Group>
                         </>
                         } />
      </Form>
    </>
  )
}

export default Account

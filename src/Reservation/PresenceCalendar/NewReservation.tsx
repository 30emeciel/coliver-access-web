import { Alert, Button, Col, Form, Input, message, Modal, Radio, Row, Select, Space, Steps, Switch } from "antd"
import TheCalendar from "./TheCalendar"
import React, { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faArrowRight,
  faBackward,
  faBed, faCheckCircle,
  faForward,
  faLaptopHouse,
} from "@fortawesome/free-solid-svg-icons"
import { TReservationKind } from "../../models/Reservation"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import { CSSTransition, SwitchTransition } from "react-transition-group"
import { Interval } from "luxon"
import { $enum } from "ts-enum-util"
import BackButton from "../../Buttons/BackButton"
import CancelButton from "../../Buttons/CancelButton"

const { Step } = Steps;

const { Option } = Select;

const getIntervalFromDateArr = (arrivalDate: Date, departureDate: Date) => {
  if (departureDate.getDate() === arrivalDate.getDate()) {
    return null
  }
  const interval = Interval.fromDateTimes(arrivalDate, departureDate)
  if (!interval.isValid) {
    throw Error("interval is not valid")
  }
  return interval
}

enum StepId {
  KIND,
  COLIVING_DEPARTURE,
  INFO,
  ESTIMATE,
  CONTRIBUTION,
}

export default function NewReservation(
  {
    calendarContext,
    firstCalValue,
    onSubmit,
    onCancel,
  }:
    {
      calendarContext: TCalendarContext,
      firstCalValue: Date,
      onSubmit: (kind: TReservationKind) => void,
      onCancel: () => void,
    },
) {
  const [kind, setKind] = useState(TReservationKind.COLIVING)
  const [contributeLater, setContributeLater] = useState(false)
  const [fourHours, setFourHours] = useState(false)

  const [arrivalDate, setArrivalDate] = useState(firstCalValue)
  const [departureDate, setDepartureDate] = useState<Date | null>(null)

  const [interval, setInterval] = useState<null | Interval>(null)
  useEffect(() => {
    if (departureDate) {
      setInterval(getIntervalFromDateArr(arrivalDate, departureDate))
    }
  }, [arrivalDate, departureDate, setInterval])

  const [current, setCurrent] = React.useState(StepId.KIND);
  const [stepHistory, setStepHistory] = useState<StepId[]>([])
  const [nextStepId, setNextStepId] = useState<StepId| null>(StepId.COLIVING_DEPARTURE)

  const numberOfNights = interval ? interval.count("days") - 1 : null

  const hasNext = nextStepId != null
  const hasPrevious = stepHistory.length > 0

  const next = () => {
    if (!nextStepId) {
      throw Error("no next available")
    }
    stepHistory.push(current)
    setStepHistory(stepHistory)
    setCurrent(nextStepId);
  };

  const prev = () => {
    const last = stepHistory.pop()
    if (last == undefined) {
      throw Error("no previous available")
    }
    setCurrent(last);
    setStepHistory(stepHistory)
  };



  function getStep(id: StepId) {

    return $enum.mapValue(id).with({
      [StepId.KIND]: {
        title: 'Type',
        content: <>
          <h3>Que veux-tu réserver ?</h3>
          <Radio.Group value={kind.valueOf()} buttonStyle="solid" onChange={(value) => {
            setKind($enum(TReservationKind).getValueOrThrow(value.target.value))
          }}>
            <Space direction="vertical">
            <Radio.Button value="COLIVING"><FontAwesomeIcon icon={faBed} /> Je dors (Coliving)</Radio.Button>
            <Radio.Button value="COWORKING"><FontAwesomeIcon icon={faLaptopHouse} /> Je ne dors pas
              (Coworking)</Radio.Button>
            </Space>
          </Radio.Group>
        </>
      },
      [StepId.COLIVING_DEPARTURE]: {
        title: 'Départ',
        disabled: kind != TReservationKind.COLIVING,
        content: <Row gutter={[8, 8]} justify="center">
          <Col flex="350px">
            <Alert message={interval ? <>Tu vas rester {numberOfNights} nuits</> : <>Choisis ton jour de départ</>} />
            <br />
            <TheCalendar calendarContext={calendarContext} isRangeMode={true}
                         calValue={departureDate != null ? [arrivalDate, departureDate] : arrivalDate}
                         onChange={(d) => {
                           const dd = d as Date[]
                           if (dd) {
                             setArrivalDate(dd[0])
                             setDepartureDate(dd[1])
                           }
                         }} />,
          </Col>
        </Row>
      },
      [StepId.INFO]: {
        title: "Plus d'info",
        content: <>
          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
            <Form.Item label="Ton heure d'arrivée estimée" wrapperCol={{span: 4}}>
              <Select allowClear={true}>
                <Option value="8h-10h">8h-10h</Option>
                <Option value="10h-12h">10h-12h</Option>
                <Option value="12h-14h">12h-14h</Option>
                <Option value="14h-16h">14h-16h</Option>
                <Option value="16h-18h">16h-18h</Option>
                <Option value="18h-20h">18h-20h</Option>
                <Option value="20h-22h">20h-22h</Option>
                <Option value="22h-minuit">22h-minuit</Option>

                <Option value="matin">matin</Option>
                <Option value="après-midi">après-midi</Option>
                <Option value="soir">soir</Option>

              </Select>
            </Form.Item>
            <Form.Item label="4h par jour" help="Je souhaite participer au programme Contribuer 4h par jour">
              <Switch checked={fourHours} onChange={(e) => setFourHours(e)}/>
            </Form.Item>
          </Form>

        </>
      },
      [StepId.ESTIMATE]: {
        title: 'Estimation',
        content: <>


          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
            <Form.Item label="Contribution suggérée" wrapperCol={{span: 4}}>
              <Input readOnly suffix="€" value={numberOfNights ? numberOfNights * 35 : 0}/>
            </Form.Item>
            <Form.Item label="dont pour les repas" wrapperCol={{span: 4}}>
              <Input readOnly suffix="€" value={numberOfNights ? numberOfNights * 7 : 0}/>
            </Form.Item>
            <Form.Item label="Je souhaite contribuer plus tard"
                       help="Je vais recevoir un e-mail à la fin de mon expérience">
              <Switch checked={contributeLater} onChange={(e) => setContributeLater(e)}/>
            </Form.Item>
          </Form>
        </>
      },
      [StepId.CONTRIBUTION]: {
        title: 'Contribution',
        disabled: contributeLater,
        content: <>

          Tu peux contribuer avec une carte bancaire en utilisant cette page
          <a target="_blank" href="https://lydia-app.com/collect/30eme-ciel/fr">https://lydia-app.com/collect/30eme-ciel/fr</a>.
          <br />
          Une fois ta contribution faites, reviens sur cette page pour confirmer ta demande.

        </>
      },
    })
  }


  useEffect(() => {
    const currentStepId = current
    const nextStepId = $enum.mapValue(currentStepId).with({
      [StepId.KIND]: kind == TReservationKind.COLIVING ? StepId.COLIVING_DEPARTURE : StepId.INFO,
      [StepId.COLIVING_DEPARTURE]: StepId.INFO,
      [StepId.INFO]: StepId.ESTIMATE,
      [StepId.ESTIMATE]: contributeLater ? null : StepId.CONTRIBUTION,
      [StepId.CONTRIBUTION]: null,
    })
    setNextStepId(nextStepId)
  }, [current, setNextStepId, kind, contributeLater])

  const buttons = <>
    <Space>
    {hasPrevious && (
      <Button onClick={() => prev()}>
        <FontAwesomeIcon icon={faArrowLeft} /> Précédent
      </Button>
    )}
    {hasNext && (
    <Button type="primary" onClick={() => next()}>
      Suivant <FontAwesomeIcon icon={faArrowRight} />
    </Button>
  )}
  {!hasNext && (
    <Button type="primary" onClick={() => {
      message.success('Merci pour ta présence avec nous ❤')
      onCancel()
    }}>
      Envoyer <FontAwesomeIcon icon={faCheckCircle} />
    </Button>
  )}
    </Space>
  </>


  return <>
    <Modal visible={true} width={800} destroyOnClose={true} onCancel={onCancel} footer={buttons}>
        <Steps
          type="navigation"
          current={current}
          responsive={true}
          size="small"
        >
          {$enum(StepId).getValues().map(stepNumber => {
            const item = getStep(stepNumber)
            return <Step key={item.title} title={item.title} disabled={item.disabled}
                  status={item.disabled ? "error" : undefined} />
          })}
        </Steps>
        <br />
        <SwitchTransition mode="out-in">
          <CSSTransition key={current} classNames="fade"
                         addEndListener={(node: any, done: any) => node.addEventListener("transitionend", done, false)}>
            <div className="steps-content">
              {getStep($enum(StepId).getValues()[current]).content}
            </div>
          </CSSTransition>
        </SwitchTransition>

        <div className="steps-action">
        </div>
    </Modal>
  </>
}

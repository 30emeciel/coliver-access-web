import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
} from "antd"
import TheCalendar from "./TheCalendar"
import React, { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faArrowRight, faBed, faCheckCircle, faLaptopHouse } from "@fortawesome/free-solid-svg-icons"
import {
  createReservation,
  TColivingReservation,
  TCoworkingReservation,
  TReservationContributionState,
  TReservationKind,
} from "../../models/Reservation"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import { CSSTransition, SwitchTransition } from "react-transition-group"
import { DateTime, Interval } from "luxon"
import { $enum } from "ts-enum-util"
import Text from "antd/es/typography/Text"

const { Step } = Steps

const { Option } = Select

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
  CONTRIBUTION,
}

const chooseToTransition = false

const COLIVING_PRICE_PER_NIGHT = 20
const MISC_PRICE_PER_DAY = 2 // coliver resident => 19 euros

const COWORKING_PRICE_PER_DAY = 13

const MEAL_PRICE_PER_DAY = 6

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
      onSubmit: () => void,
      onCancel: () => void,
    },
) {
  const currentUser = calendarContext.pax
  const [kind, setKind] = useState<TReservationKind | null>(null)
  const [contributeLater, setContributeLater] = useState(false)
  // const [fourHours, setFourHours] = useState(false)

  const [arrivalDate, setArrivalDate] = useState(firstCalValue)
  const [arrivalTime, setArrivalTime] = useState<string | undefined>(undefined)
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [price, setPrice] = useState<number | undefined>(undefined)

  const [interval, setInterval] = useState<null | Interval>(null)
  useEffect(() => {
    if (departureDate) {
      setInterval(getIntervalFromDateArr(arrivalDate, departureDate))
    }
  }, [arrivalDate, departureDate, setInterval])

  const [currentStepId, setCurrentStepId] = useState(StepId.KIND)
  const [stepIdsHistory, setStepIdsHistory] = useState<StepId[]>([])

  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const numberOfNights = interval ? interval.count("days") - 1 : null

  const stay_suggested_price = kind == TReservationKind.COLIVING ? (numberOfNights ? numberOfNights * COLIVING_PRICE_PER_NIGHT : null) : COWORKING_PRICE_PER_DAY
  const misc_suggested_price = kind == TReservationKind.COLIVING ? (numberOfNights ? numberOfNights * MISC_PRICE_PER_DAY : null) : MISC_PRICE_PER_DAY
  const meal_suggested_price = kind == TReservationKind.COLIVING ? (numberOfNights ? numberOfNights * MEAL_PRICE_PER_DAY : null) : MEAL_PRICE_PER_DAY
  const total_suggested_price = stay_suggested_price && misc_suggested_price && meal_suggested_price ? stay_suggested_price + misc_suggested_price + meal_suggested_price : null

  function getStep(stepId: StepId) {
    return $enum.mapValue(stepId).with({
      [StepId.KIND]: {
        title: "Type",
        nextStep: kind == TReservationKind.COLIVING ? StepId.COLIVING_DEPARTURE : StepId.INFO,
        canGoNext: kind != null,
        canGoPrevious: false,
        content: <>
          <h3>Que veux-tu réserver ?</h3>
          <Radio.Group value={kind?.valueOf()} buttonStyle="solid" onChange={(value) => {
            const newKind = $enum(TReservationKind).getValueOrThrow(value.target.value)
            setKind(newKind)
            if (chooseToTransition) {
              //const nextStepId = getNextStep(newKind)
              next()
            }
          }}>
            <Space direction="vertical">
              <Radio.Button value="COLIVING"><FontAwesomeIcon icon={faBed} /> Je dors (Coliving)</Radio.Button>
              <Radio.Button value="COWORKING"><FontAwesomeIcon icon={faLaptopHouse} /> Je ne dors pas
                (Coworking)</Radio.Button>
            </Space>
          </Radio.Group>
        </>,
      },
      [StepId.COLIVING_DEPARTURE]: {
        title: "Départ",
        disabled: kind != TReservationKind.COLIVING,
        nextStep: StepId.INFO,
        canGoNext: interval != null,
        canGoPrevious: true,
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
                             if (chooseToTransition && dd[1]) {
                               next()
                             }
                           }
                         }} />,
          </Col>
        </Row>,
      },
      [StepId.INFO]: {
        title: "Plus d'info",
        nextStep: StepId.CONTRIBUTION,
        canGoNext: true,
        canGoPrevious: true,
        content: <>
          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
            <Form.Item label="Ton heure d'arrivée estimée" wrapperCol={{ span: 4 }}>
              <Select<string | undefined> allowClear={true} value={arrivalTime} onSelect={(e) => setArrivalTime(e)}>
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

            {/*<Form.Item label="4h par jour" help="Je souhaite participer au Programme de la journée">
              <Switch checked={fourHours} onChange={(e) => setFourHours(e)} />
            </Form.Item>*/}

          </Form>

        </>,
      },
      [StepId.CONTRIBUTION]: {
        title: "Contribution",
        nextStep: null,
        canGoNext: contributeLater || price != null,
        canGoPrevious: true,
        content: <>

          <p>
            Le 30ème Ciel est un lieu à prix libre. C'est-à-dire que peu importe le montant de ta contribution,
            l'important pour nous est que ce soit juste et parfait pour toi 😊.
            Tu peux contribuer plus ou moins que le montant suggéré.
            Quelle que soit ta contribution, nous te remercions de nous aider à faire perdurer ce lieu 🏡 !
          </p>

          <Form labelCol={{ span: 12 }} wrapperCol={{ span: 20 }}>

            <Form.Item label="Contribution suggérée" wrapperCol={{ span: 4 }}>
              <Text strong>{total_suggested_price}€</Text>
            </Form.Item>
            <Collapse ghost={true}>
              <Collapse.Panel key="details" header="Détails du calcul">
                <Form.Item label="Loyer" tooltip={<ul>
                  <li>Loyer</li>
                  <li>Assurance</li>
                </ul>} wrapperCol={{ span: 4 }}
                           help={`${kind == TReservationKind.COLIVING ? COLIVING_PRICE_PER_NIGHT : COWORKING_PRICE_PER_DAY}€ par jour`}>
                  <span>{stay_suggested_price}€</span>
                </Form.Item>
                <Form.Item label="Repas" help={`${MEAL_PRICE_PER_DAY}€ par jour`}
                           tooltip={<p>Estimation pour 3 repas par jour</p>}>
                  <span>{meal_suggested_price}€</span>
                </Form.Item>
                <Form.Item label="Autre" tooltip={<ul>
                  <li>Eau</li>
                  <li>Électricité</li>
                  <li>Internet</li>
                  <li>Sécurisexe</li>
                  <li>Blanchisserie</li>
                  <li>Maintenance</li>
                </ul>} wrapperCol={{ span: 4 }} help={`${MISC_PRICE_PER_DAY}€ par jour`}>
                  <span>{misc_suggested_price}€</span>
                </Form.Item>
              </Collapse.Panel>
            </Collapse>

            <Divider />

            <Form.Item label="Je souhaite contribuer après mon passage">
              <Switch checked={contributeLater} onChange={(e) => setContributeLater(e)} />
            </Form.Item>
            {contributeLater ?
              <p>Tu vas recevoir un e-mail à la fin de ton expérience</p>
              : <>
                <Form.Item label="Ma contribution">
                  <Form.Item noStyle>
                    <InputNumber<number> step={10} value={price} onChange={(e) => setPrice(e)}
                                         placeholder={total_suggested_price?.toString()} />
                  </Form.Item>
                  <span className="ant-form-text"> €</span>
                </Form.Item>

                <p>
                  Je t'invite à te rendre sur cette page <a
                  target="_blank"
                  href="https://lydia-app.com/collect/30eme-ciel/fr">https://lydia-app.com/collect/30eme-ciel/fr</a>.
                  pour payer ta contribution, soit avec une carte bancaire ou Lydia directement si tu es sûr ton
                  téléphone mobile.
                </p>
                <p>
                  Lorsque tu fais ta contribution, il est préférable que tu inscrives ton nom pour que nous puissions
                  plus
                  facilement gérer notre comptabilité :)
                </p>
                <p>Si ta réservation n'est pas validée, tu seras remboursé intégralement.</p>
                <p>
                  Une fois ta contribution faites, reviens sur cette page pour envoyer ta demande de réservation.
                </p>
              </>
            }

          </Form>
        </>,
      },
    })
  }

  const currentStep = getStep(currentStepId)

  const canGoNext = currentStep.canGoNext
  const canGoPrevious = currentStep.canGoPrevious && stepIdsHistory.length > 0
  const isFinish = currentStep.nextStep == null

  const next = () => {
    const stepId = currentStep.nextStep
    if (!stepId) {
      throw Error("no next available")
    }
    stepIdsHistory.push(currentStepId)
    setStepIdsHistory(stepIdsHistory)
    setCurrentStepId(stepId)
  }

  const prev = () => {
    const last = stepIdsHistory.pop()
    if (last == undefined) {
      throw Error("no previous available")
    }
    setCurrentStepId(last)
    setStepIdsHistory(stepIdsHistory)
  }


  const buttons = <>
    <Space>

        <Button disabled={!canGoPrevious} onClick={() => prev()}>
          <FontAwesomeIcon icon={faArrowLeft} /> Précédent
        </Button>

      {!isFinish ?
        <Button disabled={!canGoNext} type="primary" onClick={() => next()}>
          Suivant <FontAwesomeIcon icon={faArrowRight} />
        </Button>

      :
        <Button loading={isFormSubmitting} disabled={!canGoNext} type="primary" onClick={async () => {
          if (!contributeLater && !price) {
            throw new Error("!contributeLater && !price")
          }

          const p = contributeLater || !price ? null : price // avoid compiler warning that price can be undefined

          setIsFormSubmitting(true)
          let request_data
          if (kind == TReservationKind.COLIVING) {
            if (!interval || !numberOfNights) {
              throw new Error("!interval || !numberOfNights")
            }
            const arrivalDate = interval.start
            const departureDate = interval.end
            request_data = new TColivingReservation(
              currentUser.sub,
              arrivalDate,
              departureDate,
              p,
              contributeLater ? TReservationContributionState.START : TReservationContributionState.PENDING,
            )
          }
          else {
            const start = DateTime.fromJSDate(arrivalDate)
            request_data = new TCoworkingReservation(
              currentUser.sub,
              start,
              p,
              contributeLater ? TReservationContributionState.START : TReservationContributionState.PENDING,
            )
          }
          await createReservation(request_data)
          message.success("Ta demande de réservation est envoyée. Nous allons revenir vers toi bientôt. Merci ❤")
          onSubmit()

        }}>
          Envoyer <FontAwesomeIcon icon={faCheckCircle} />
        </Button>
      }
    </Space>
  </>


  return <>
    <Modal keyboard={true} maskClosable={false} visible={true} width={700} destroyOnClose={true} onCancel={onCancel} footer={buttons}>
      <Steps
        type="navigation"
        current={currentStepId}
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
        <CSSTransition key={currentStepId} classNames="fade"
                       addEndListener={(node: any, done: any) => node.addEventListener("transitionend", done, false)}>
          <div className="steps-content">
            {currentStep.content}
          </div>
        </CSSTransition>
      </SwitchTransition>

      <div className="steps-action">
      </div>
    </Modal>
  </>
}

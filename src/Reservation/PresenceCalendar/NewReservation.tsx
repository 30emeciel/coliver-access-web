import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Steps,
  Switch,
} from "antd"
import TheCalendar from "./TheCalendar"
import React, { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faArrowRight,
  faBed,
  faCheckCircle,
  faExternalLinkAlt,
  faLaptopHouse,
} from "@fortawesome/free-solid-svg-icons"
import {
  createReservation,
  getMealPlanPrice,
  getMealPlanTitle,
  TColivingReservation,
  TCoworkingReservation,
  TMealPlans,
  TReservationContributionState,
  TReservationKind,
} from "../../models/Reservation"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import { CSSTransition, SwitchTransition } from "react-transition-group"
import { DateTime, Interval } from "luxon"
import { $enum } from "ts-enum-util"
import Text from "antd/es/typography/Text"
import { useErrorHandler } from "react-error-boundary"
import MediaQuery from "react-responsive"

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
  PAYMENT,
}

const chooseToTransition = false

// coliver resident => 19 euros
const COLIVING_PRICE_PER_NIGHT = 24
const COWORKING_PRICE_PER_DAY = 12
const MISC_PRICE_PER_DAY = 3

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
  const [payLater, setPayLater] = useState(false)
  const [freePrice, setFreePrice] = useState(false)
  // const [fourHours, setFourHours] = useState(false)

  const [arrivalDate, setArrivalDate] = useState(firstCalValue)
  const [arrivalTime, setArrivalTime] = useState<string | undefined>(undefined)
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [mealPlan, setMealPlan] = useState<TMealPlans | undefined>(undefined)
  const [isConditionalArrival, setIsConditionalArrival] = useState(false)
  const [conditionalArrival, setConditionalArrival] = useState<string | undefined>(undefined)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [note, setNote] = useState<string|undefined>(undefined)
  const [isBlockedPax, setIsBlockedPax] = useState(false)
  const [blockedPax, setBlockedPax] = useState<string|undefined>(undefined)


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

  const stay_suggested_price = kind == TReservationKind.COLIVING ? (numberOfNights ? numberOfNights * COLIVING_PRICE_PER_NIGHT : undefined) : COWORKING_PRICE_PER_DAY
  const misc_suggested_price = kind == TReservationKind.COLIVING ? (numberOfNights ? numberOfNights * MISC_PRICE_PER_DAY : undefined) : MISC_PRICE_PER_DAY
  const meal_suggested_price_per_day = mealPlan ? getMealPlanPrice(mealPlan) : undefined
  const meal_suggested_price = kind == TReservationKind.COLIVING ? (numberOfNights && meal_suggested_price_per_day != undefined ? numberOfNights * meal_suggested_price_per_day : undefined) : meal_suggested_price_per_day
  const total_suggested_price = stay_suggested_price && misc_suggested_price && meal_suggested_price != undefined ? stay_suggested_price + misc_suggested_price + meal_suggested_price : undefined
  const minPrice = total_suggested_price ? total_suggested_price - total_suggested_price / 2 : undefined
  const maxPrice = total_suggested_price ? total_suggested_price + total_suggested_price / 2 : undefined

  useEffect(() => {
    setPrice(total_suggested_price)
  }, [kind, mealPlan, interval, setPrice])

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
        nextStep: StepId.PAYMENT,
        canGoNext: mealPlan != undefined,
        canGoPrevious: true,
        content: <>
          <Form labelCol={{ span: 12 }}>
            <Form.Item label="Nombre de repas par jour" required={true} tooltip="Moyenne de repas par jour que tu penses prendre pendant ton séjour. Le prix suggéré à la fin sera calculée en fonction de ton choix.">
              <Radio.Group value={mealPlan} onChange={(e) => {setMealPlan(e.target.value)}}>
                {$enum(TMealPlans).map((t) => {
                  return <Radio key={t} value={t}>{getMealPlanTitle(t)}</Radio>
                })}
              </Radio.Group>

            </Form.Item>

            <Form.Item label="Ton heure d'arrivée estimée" wrapperCol={{ span: 4 }}>
              <Select<string | undefined> allowClear={true} value={arrivalTime} onSelect={(e) => setArrivalTime(e)}>
                <Option value="matin">matin</Option>
                <Option value="après-midi">après-midi</Option>
                <Option value="soir">soir</Option>
                <Option value="8h-10h">8h-10h</Option>
                <Option value="10h-12h">10h-12h</Option>
                <Option value="12h-14h">12h-14h</Option>
                <Option value="14h-16h">14h-16h</Option>
                <Option value="16h-18h">16h-18h</Option>
                <Option value="18h-20h">18h-20h</Option>
                <Option value="20h-22h">20h-22h</Option>
                <Option value="22h-minuit">22h-minuit</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Ma venue est conditionnée par la venue d'une +1">
              <Switch checked={isConditionalArrival} onChange={(e) => setIsConditionalArrival(e)} />
            </Form.Item>
            {isConditionalArrival &&
            <Form.Item label="Nom et/ou Facebook de ma +1">
              <Input value={conditionalArrival} onChange={(e) => setConditionalArrival(e.target.value)} />
            </Form.Item>
            }
            <Form.Item
              label={<Text>Ma venue est conditionnée par la <Text strong>non-présence</Text> d'une personne</Text>}
              help="Parmi les personnes susceptibles de participer, il y en a-t-il une dont la présence te mettrait en tension ou t'empêcherait de participer sereinement ?">
              <Switch checked={isBlockedPax} onChange={(e) => setIsBlockedPax(e)} />
            </Form.Item>
            {isBlockedPax &&
            <Form.Item
              label="Nom et/ou Facebook de la ou les personne·s">
              <Input value={blockedPax} onChange={(e) => setBlockedPax(e.target.value)} />
            </Form.Item>
            }
            <Divider />

            <Form.Item label="Autre chose à nous partager ?">
              <Input.TextArea value={note} autoSize={{minRows: 3}} showCount={true} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
            </Form.Item>

            {/*<Form.Item label="4h par jour" help="Je souhaite participer au Programme de la journée">
              <Switch checked={fourHours} onChange={(e) => setFourHours(e)} />
            </Form.Item>*/}

          </Form>

        </>,
      },
      [StepId.PAYMENT]: {
        title: "Paiement",
        nextStep: null,
        canGoNext: payLater || (price != null),
        canGoPrevious: true,
        extraButtons: currentUser.allowDelayedContribution ?
          <Space direction="horizontal">
            <Text>Je souhaite payer plus tard</Text>
              <Switch checked={payLater} onChange={(e) => setPayLater(e)} />
          </Space>
         : <></>,
        content: <>

          <p>
            Le 30ème Ciel est un lieu à prix juste. C'est-à-dire que peu importe le montant de ta contribution,
            l'important pour nous est que ce soit juste et parfait pour toi 😊.
            Tu peux payer plus ou moins que le montant suggéré.
            Quelle que soit ta contribution, nous te remercions de nous aider à faire perdurer ce lieu 🏡 !
          </p>

          <Form labelCol={{ span: 4 }} layout="horizontal">

            <Form.Item label="Prix suggéré">
              <Text strong>{total_suggested_price}€</Text>
            </Form.Item>
            <Collapse ghost={true}>
              <Collapse.Panel key="details" header="Détails du calcul">
                <Form.Item label="Habitation" tooltip={<p>
                  Inclus ce qu'on peut attendre d'un Coliving classique :
                  <ul>
                    <li>Loyer</li>
                    <li>Assurance</li>
                    <li>Eau</li>
                    <li>Électricité</li>
                    <li>Internet</li>
                    <li>Blanchisserie</li>
                    <li>Maintenance</li>
                </ul>
                </p>}
                           help={`${kind == TReservationKind.COLIVING ? COLIVING_PRICE_PER_NIGHT : COWORKING_PRICE_PER_DAY}€ par jour`}>
                  <span>{stay_suggested_price}€</span>
                </Form.Item>
                <Form.Item label="Repas" help={`${meal_suggested_price_per_day}€ par jour`}
                           tooltip={<p>Estimation pour 3 repas bio, équilibré et local par jour</p>}>
                  <span>{meal_suggested_price}€</span>
                </Form.Item>
                <Form.Item label="Autre" tooltip={<p>
                  Inclus ce qu'on ne retrouve pas dans les lieux traditionnels
                  <ul>
                    <li>Facilitation des cercles pour l'autogestion</li>
                    <li>Des activités de groupe (yoga, méditation, ...)</li>
                    <li>Support émotionnel</li>
                    <li>Sécurisexe</li>
                    <li>Accès à certains événements sur place</li>
                    <li>Les humains qui font vivre lieu</li>
                  </ul>
                </p>} help={`${MISC_PRICE_PER_DAY}€ par jour`}>
                  <span>{misc_suggested_price}€</span>
                </Form.Item>
              </Collapse.Panel>
            </Collapse>

            <Divider />

            {payLater ?
              <p>Tu vas recevoir un e-mail à la fin de ton expérience</p>
              : <>
                <Form.Item label="Mon prix">
                  {freePrice ? <>
                    <Form.Item noStyle>
                      <InputNumber<number>
                        step={10}
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(e)}
                        placeholder={total_suggested_price?.toString()} />

                    </Form.Item>
                    <span className="ant-form-text"> €</span>
                    </>
                    :
                    <Text strong>{price} €</Text>
                  }

                </Form.Item>
                {freePrice ||
                <Form.Item>
                  <Row gutter={{ xs: 2, sm: 4, md: 8, lg: 8 }} wrap={false}>
                    <Col flex="none">Solidaire</Col>
                    <Col flex="auto">
                      <Slider
                        marks={
                          {
                            [total_suggested_price ?? 0]: `${total_suggested_price}€`,
                          }
                        }
                        min={minPrice}
                        max={maxPrice}
                        onChange={(e: number) => setPrice(e)}
                        value={price}
                      />
                    </Col>
                    <Col flex="none">Supportaire</Col>
                  </Row>

                </Form.Item>
                }

                <Form.Item label="Je demande un prix libre">
                  <Switch checked={freePrice} onChange={(e) => setFreePrice(e)} />
                </Form.Item>

                <p>
                  Tu peux payer soit avec une carte bancaire ou avec Lydia si tu es sur ton
                  téléphone portable. Il est préférable que tu inscrives ton nom pour que nous puissions
                  plus facilement gérer notre comptabilité 😉.
                </p>
                <p>Si ta réservation n'est pas acceptée, tu seras remboursé intégralement.</p>
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

  const handleError = useErrorHandler()

  const buttons = <>
    <Space>
      {currentStep.extraButtons}

        <Button disabled={!canGoPrevious} onClick={() => prev()}>
          <FontAwesomeIcon icon={faArrowLeft} /> Précédent
        </Button>

      {!isFinish ?
        <Button disabled={!canGoNext} type="primary" onClick={() => next()}>
          Suivant <FontAwesomeIcon icon={faArrowRight} />
        </Button>

      :
        <Button loading={isFormSubmitting} disabled={!canGoNext} type="primary" onClick={ () => {
          if (!payLater && !price) {
            throw new Error("!contributeLater && !contribution")
          }

          if (!total_suggested_price) {
            throw new Error("!total_suggested_price")
          }

          if (!mealPlan) {
            throw new Error("!mealPlan")
          }

          const p = payLater || !price ? null : price // avoid compiler warning that contribution can be undefined

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
              total_suggested_price,
              payLater ? TReservationContributionState.START : TReservationContributionState.PENDING,
              mealPlan,
              undefined,
              undefined,
              undefined,
              arrivalTime,
              note,
              conditionalArrival,
            )
          }
          else {
            const start = DateTime.fromJSDate(arrivalDate)
            request_data = new TCoworkingReservation(
              currentUser.sub,
              start,
              p,
              total_suggested_price,
              payLater ? TReservationContributionState.START : TReservationContributionState.PENDING,
              mealPlan,
              undefined,
              undefined,
              undefined,
              arrivalTime,
              note,
              conditionalArrival,
            )
          }
          createReservation(request_data).then(
            () => {
              if (payLater) {
                message.success("Ta demande de réservation est envoyée. Nous allons revenir vers toi bientôt. Merci ❤")
                  .then()
              }
              else {
                window.location.href = "https://lydia-app.com/collect/30eme-ciel/fr"
              }
              onSubmit()
            },
            handleError
          )

        }}>
          { payLater ? <>Envoyer <FontAwesomeIcon icon={faCheckCircle} /> </> :<>Payer <FontAwesomeIcon icon={faExternalLinkAlt}/></> }
        </Button>
      }
    </Space>
  </>


  return <>
    <Modal keyboard={true} maskClosable={false} visible={true} width={1000} destroyOnClose={true} onCancel={onCancel} footer={buttons}>
      <MediaQuery minWidth={600}>
        <Steps
          type="navigation"
          current={currentStepId}
          size="small"
        >
          {$enum(StepId).getValues().map(stepNumber => {
            const item = getStep(stepNumber)
            return <Step key={item.title} title={item.title} disabled={item.disabled}
                         status={item.disabled ? "error" : undefined} />
          })}
        </Steps>
        <br />
      </MediaQuery>
      <SwitchTransition mode="out-in">
        <CSSTransition key={currentStepId} classNames="fade"
                       addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}>
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

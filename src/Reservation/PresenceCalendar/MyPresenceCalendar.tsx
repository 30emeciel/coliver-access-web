import { faBed, faLaptopHouse, faUserClock } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Col, Drawer, Modal, Row, Space } from "antd"
import { DateTime } from "luxon"
import { useContext, useEffect, useState } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import { TPax } from "src/models/Pax"
import ColivingForm from "./ColivingForm"
import CoworkingForm from "./CoworkingForm"
import { TCalendarContext, TMapDays, TMapGlobalDays } from "./MyPresenceCalendarTypes"
import ReservationLoader from "./ReservationLoader"
import TheCalendar from "./TheCalendar"
import myloglevel from "src/core/myloglevel"
import { TDay, TDayConverter } from "../../models/Day"
import BackButton from "../../Buttons/BackButton"

const log = myloglevel.getLogger("MyPresenceCalendar")

enum AppStates {
  Normal,
  ShowEmptyForm,
  ShowOccupiedForm,
  CoworkingForm,
  ColivingForm,
  EditDays,
}

export default function MyPresenceCalendar({ pax: initialPax }: { pax?: TPax }) {
  const { doc: currentUserData } = useContext(PaxContext)
  const pax = initialPax ? initialPax : currentUserData!

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [isFirstTimer, setIsFirstTimer] = useState(false)
  const [appState, setAppState] = useState(AppStates.Normal)

  const [listDays, listDaysLoading, listDaysError] = useCollectionData<TDay>(
    db.collection(`pax/${pax.sub}/days`).withConverter(TDayConverter).orderBy("on", "asc"),
  )

  const [userDays, setUserDays] = useState<TMapDays>(new Map())
  const [globalDays, setGlobalDays] = useState<TMapGlobalDays>(new Map())

  const [calValue, setCalValue] = useState<Date | null>(null)

  const calendarContext = new TCalendarContext({
    userDays: userDays,
    setUserDays: setUserDays,

    globalDays: globalDays,
    setGlobalDays: setGlobalDays,

    isLoading: listDaysLoading,
    pax: pax,
  })

  useEffect(() => {
    if (!listDays) {
      return
    }

    log.info("Refreshing calendar days...")
    const mapDays = new Map(
      listDays
        //      .filter((day) => day.status === "PENDING_REVIEW")
        .map((day) => {
          // TODO: #1 DateTime should be TZ insensitive
          const d = day.on
          return [d.toMillis(), day] as [number, TDay]
        }),
    )
    setUserDays(mapDays)
  }, [listDays, setUserDays])

  /******************************************************************************************************************
   * Functions
   *****************************************************************************************************************/

  /******************************************************************************************************************
   * Inner Components
   *****************************************************************************************************************/

  const FirstTimerIntro = () => {
    return (
      <Row>
        <Alert
          type="warning"
          message="You are a new! Welcome 👋😀. For ease of integration, you recommand you to book a Coworking day on any Monday."
        />
      </Row>
    )
  }

  const onClickDayFct = (d: Date) => {
    //if (appState === AppStates.Normal) {
    const dt = DateTime.fromJSDate(d)
    setCalValue(d)
    if (calendarContext.userDays.has(dt.toMillis())) {
      setAppState(AppStates.ShowOccupiedForm)
    } else {
      setAppState(AppStates.ShowEmptyForm)
    }
    //}
  }


  return (
    <>
      <h2>
        {!(pax === currentUserData) && <> <FontAwesomeIcon icon={faUserClock} /> Calendrier de présence de {pax.name}</>}
      </h2>
      <Alert
        type="info"
        message="Pour réserver, commence par cliquer sur le jour de ta venue." />
      {isFirstTimer && <FirstTimerIntro />}
      <br />
      {new Set([AppStates.Normal, AppStates.ShowEmptyForm, AppStates.ShowOccupiedForm]).has(appState) && (
        <Row gutter={8}>
          <Col>
            <TheCalendar
              calendarContext={calendarContext}
              isRangeMode={false}
              calValue={calValue}
              onClickDay={onClickDayFct}
            />
            <>
              <Modal visible={new Set([AppStates.ShowEmptyForm]).has(appState)} onCancel={() => {
                setCalValue(null)
                setAppState(AppStates.Normal)
              }} footer={[<BackButton onClick={() => {
                setCalValue(null)
                setAppState(AppStates.Normal)
              }}/>]}>
                <p>Que veux-tu réserver ?</p>
                <Space direction="vertical">
                  <Button type="primary" onClick={() => setAppState(AppStates.ColivingForm)}>
                    <FontAwesomeIcon icon={faBed} /> Coliving
                  </Button>
                  <Button type="primary" onClick={() => setAppState(AppStates.CoworkingForm)}>
                    <FontAwesomeIcon icon={faLaptopHouse} /> Coworking
                  </Button>
                </Space>
              </Modal>
            </>

            <>
              <Modal visible={new Set([AppStates.ShowOccupiedForm]).has(appState)} onCancel={() => {
                setCalValue(null)
                setAppState(AppStates.Normal)
              }} footer={[<BackButton onClick={() => {
                setCalValue(null)
                setAppState(AppStates.Normal)
              }}/>]}>
                <ReservationLoader
                  calendarPax={pax}
                  calValue={calValue!}
                  onSubmit={() => {
                    setCalValue(null)
                    setAppState(AppStates.Normal)
                  }}
                />
              </Modal>
            </>
          </Col>
        </Row>
      )}

      {appState === AppStates.ColivingForm && (
        <ColivingForm
          calendarContext={calendarContext}
          firstCalValue={calValue}
          onSubmit={() => {
            setCalValue(null)
            setAppState(AppStates.Normal)
          }}
          onCancel={() => {
            setAppState(AppStates.ShowEmptyForm)
          }}
        />
      )}

      {appState === AppStates.CoworkingForm && (
        <CoworkingForm
          calendarContext={calendarContext}
          firstCalValue={calValue!}
          onSubmit={() => {
            setCalValue(null)
            setAppState(AppStates.Normal)
          }}
          onCancel={() => {
            setAppState(AppStates.ShowEmptyForm)
          }}
        />
      )}
      {appState === AppStates.EditDays && <div></div>}
    </>
  )
}

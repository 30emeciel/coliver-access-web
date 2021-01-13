import { faBed, faLaptopHouse, faUserClock } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Col, Drawer, Row, Space } from "antd"
import { DateTime } from "luxon"
import { useContext, useEffect, useState } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import PaxContext from "src/core/paxContext"
import "src/core/Switch.css"
import { Pax } from "src/core/usePax"
import { $enum } from "ts-enum-util"
import ColivingForm from "./ColivingForm"
import CoworkingForm from "./CoworkingForm"
import { TCalendarContext, TMapDays, TMapGlobalDays, TUserDay, UserDayStates } from "./MyPresenceCalendarTypes"
import ReservationLoader from "./ReservationLoader"
import TheCalendar from "./TheCalendar"

enum AppStates {
  Normal,
  ShowEmptyForm,
  ShowOccupiedForm,
  NewCoworking,
  ColivingForm,
  EditDays,
}

const MyPresenceCalendar = ({ pax: initialPax }: { pax?: Pax }) => {
  const { doc: currentUserData } = useContext(PaxContext)
  const pax = initialPax ? initialPax : currentUserData!

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [isFirstTimer, setIsFirstTimer] = useState(false)
  const [appState, setAppState] = useState(AppStates.Normal)

  const [listDays, listDaysLoading, listDaysError] = useCollectionData<TUserDay>(
    db.collection(`pax/${pax.sub}/days`).orderBy("on", "asc")
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

    console.log("Refreshing calendar days...")
    const mapDays = new Map(
      listDays
        //      .filter((day) => day.status === "PENDING_REVIEW")
        .map((day) => {
          // TODO: #1 DateTime should be TZ insensitive
          let d = DateTime.fromMillis(day.on.seconds * 1000)
          let status = $enum(UserDayStates).asValueOrThrow(day.status)
          let ud = {
            kind: day.kind,
            status: status,
          }
          return [d.toMillis(), ud] as [number, TUserDay]
        })
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
    let dt = DateTime.fromJSDate(d)
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
        <FontAwesomeIcon icon={faUserClock} /> Calendrier de présence
        {!(pax === currentUserData) && <> de {pax.name}</>}
      </h2>
      <Alert
        type="info"
        message="
            Pour réserver, commence par cliquer sur le jour de ta venue."
      ></Alert>
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
              <Drawer
                visible={new Set([AppStates.ShowEmptyForm]).has(appState)}
                width={520}
                onClose={() => {
                  setCalValue(null)
                  setAppState(AppStates.Normal)
                }}
              >
                <p>Que veux-tu réserver ?</p>
                <Space direction="vertical">
                  <Button type="primary" onClick={() => setAppState(AppStates.ColivingForm)}>
                    <FontAwesomeIcon icon={faBed} /> Coliving
                  </Button>
                  <Button type="primary" onClick={() => setAppState(AppStates.NewCoworking)}>
                    <FontAwesomeIcon icon={faLaptopHouse} /> Coworking
                  </Button>
                </Space>
              </Drawer>
            </>

            <>
              <Drawer
                visible={new Set([AppStates.ShowOccupiedForm]).has(appState)}
                width={520}
                onClose={() => {
                  setCalValue(null)
                  setAppState(AppStates.Normal)
                }}
              >
                <ReservationLoader
                  calendarPax={pax}
                  calValue={calValue!}
                  onSubmit={() => {
                    setCalValue(null)
                    setAppState(AppStates.Normal)
                  }}
                />
              </Drawer>
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

      {appState === AppStates.NewCoworking && (
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

export default MyPresenceCalendar

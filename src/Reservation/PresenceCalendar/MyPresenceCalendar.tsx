import { Alert, Modal } from "antd"
import { DateTime } from "luxon"
import React, { useEffect, useState } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import db from "src/core/db"
import { TPax } from "src/models/Pax"
import { TCalendarContext, TMapDays, TMapGlobalDays } from "./MyPresenceCalendarTypes"
import ReservationLoader from "./ReservationLoader"
import TheCalendar from "./TheCalendar"
import myloglevel from "src/core/myloglevel"
import { TDay, TDayConverter } from "../../models/Day"
import BackButton from "../../Buttons/BackButton"
import NewReservation from "./NewReservation"
import { TReservationKind } from "../../models/Reservation"

const log = myloglevel.getLogger("MyPresenceCalendar")

enum AppStates {
  Normal,
  ShowEmptyForm,
  ShowOccupiedForm,
}

export default function MyPresenceCalendar({ pax }: { pax: TPax }) {

  /******************************************************************************************************************
   * States
   *****************************************************************************************************************/
  const [appState, setAppState] = useState(AppStates.Normal)

  const [listDays, listDaysLoading, ] = useCollectionData<TDay>(
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
      <Alert
        type="info"
        message="Pour réserver, commence par cliquer sur le jour de ta venue." />
        <br />
      <TheCalendar
        calendarContext={calendarContext}
        isRangeMode={false}
        calValue={calValue}
        onClickDay={onClickDayFct}
      />

        <Modal destroyOnClose={true} visible={new Set([AppStates.ShowOccupiedForm]).has(appState)} onCancel={() => {
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


      {appState == AppStates.ShowEmptyForm &&
      <NewReservation
        calendarContext={calendarContext}
        firstCalValue={calValue!}
        onSubmit={() => {
          setCalValue(null)
          setAppState(AppStates.Normal)
        }}
        onCancel={() => {
          setAppState(AppStates.Normal)
        }}
      />
      }

    </>
  )
}

import { Col, Row, Space, Spin } from "antd"
import Calendar, { CalendarTileProperties } from "react-calendar"
import "react-calendar/dist/Calendar.css"
import "./Calendar.css"
import { TCalendarContext } from "./MyPresenceCalendarTypes"
import { DateTime } from "luxon"

const TheCalendar = ({
  isRangeMode,
  onChange,
  onClickDay,
  calValue,
  calendarContext,
}: {
  isRangeMode?: boolean
  onChange?: (d: Date | Date[]) => void
  onClickDay?: (d: Date) => void
  calValue?: null | Date | Date[]
  calendarContext: TCalendarContext
}) => {
  /******************************************************************************************************************
   * Calendar helper functions
   *****************************************************************************************************************/

  const isTestNotAvailable = false
  const isFirstTimer = false

  const pendingDaysTiles = ({date}: CalendarTileProperties) => {
    const d = DateTime.fromJSDate(date)
    const today = DateTime.now().set({hour: 0, minute: 0, second: 0, millisecond: 0})
    const day = calendarContext.userDays.get(date.getTime())
    const ret:string[] = []
    if (d < today) {
      ret.push("react-calendar-past")
    }
    if (day) {
      ret.push(`${day.kind}-${day.state}`.toLowerCase())
    }

    return ret
  }

  const disabledTiles = ({date}: CalendarTileProperties) =>
    isTestNotAvailable ? (date.getDay() === 3) : isFirstTimer ? date.getDay() !== 1 : false

  const contentTiles = ({date}: CalendarTileProperties) =>
    isTestNotAvailable ? date.getDay() === 3 ? <div>Sold out</div> : null : null

  return (
    <>
      {calendarContext.isLoading ? (
        <>
          <Spin size="large">
            <span className="sr-only"> Chargement...</span>
          </Spin>{" "}
        </>
      ) : (
        <>
          <Row justify="center">
            <Col flex={"350px"}>
          <Calendar
            selectRange={isRangeMode}
            view="month"
            //showDoubleView
            //showWeekNumbers
            //showNeighboringMonth={false}
            tileClassName={pendingDaysTiles}
            tileDisabled={disabledTiles}
            tileContent={contentTiles}
            value={calValue}
            onChange={onChange}
            onClickDay={onClickDay}
          />
            </Col>
          </Row>
          <br />
          <Row gutter={[8, 8]} justify="center">
            <Col>
              <Space direction="horizontal">
                <span className="calendar-legend-box coliving-pending_review"/>
                <span>Coliving En attente</span>
              </Space>
            </Col>
            <Col>
              <Space direction="horizontal">
                <span className="calendar-legend-box coliving-confirmed"/>
                <span>Coliving Confirmé</span>
              </Space>
            </Col>
            <Col>
              <Space direction="horizontal">
                <span className="calendar-legend-box coworking-pending_review"/>
                <span>Coworking En attente</span>
              </Space>
            </Col>
            <Col>
              <Space direction="horizontal">
                <span className="calendar-legend-box coworking-confirmed"/>
                <span>Coworking Confirmé</span>
              </Space>
            </Col>
          </Row>
        </>

      )}
    </>
  )
}

export default TheCalendar

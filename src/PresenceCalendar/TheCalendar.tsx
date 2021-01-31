import { Col, Row, Space, Spin } from "antd"
import Calendar, { CalendarTileProperties } from "react-calendar"
import "react-calendar/dist/Calendar.css"
import "./Calendar.css"
import { TCalendarContext } from "./MyPresenceCalendarTypes"

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

  const pendingDaysTiles = ({ activeStartDate, date, view }: CalendarTileProperties) => {
    let day = calendarContext.userDays.get(date.getTime())
    if (!day) {
      return ""
    }
    return `${day.kind}-${day.state}`.toLowerCase()
  }

  const disabledTiles = ({ activeStartDate, date, view }: CalendarTileProperties) =>
    isTestNotAvailable ? (date.getDay() === 3 ? true : false) : isFirstTimer ? date.getDay() !== 1 : false

  const contentTiles = ({ activeStartDate, date, view }: CalendarTileProperties) =>
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
          <br />
          <Space>
              <span className="calendar-legend-box coliving-pending_review mr-1"></span>
              <span>Coliving En attente</span> <span className="calendar-legend-box coliving-confirmed mr-1"></span>
              <span>Coliving Confirmé</span>
              <span className="calendar-legend-box coworking-pending_review mr-1"></span>
              <span>Coworking En attente</span>{" "}
              <span className="calendar-legend-box coworking-confirmed mr-1"></span>
              <span>Coworking Confirmé</span>
          </Space>
        </>
      )}
    </>
  )
}

export default TheCalendar

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
    const day = calendarContext.userDays.get(date.getTime())
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

import { useCallback, useEffect, useMemo, useState } from "react";
import Row from "react-bootstrap/Row";
import Calendar, { CalendarTileProperties } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";
import Spinner from "react-bootstrap/Spinner";
import { TCalendarContext } from "./MyPresenceCalendarTypes";
import { DateTime } from "luxon";
import { Popover } from "react-bootstrap";

const TheCalendar = ({
  isRangeMode,  
  onChange,
  onClickDay,
  calValue,
  calendarContext,
}: {
  isRangeMode?: boolean;
  onChange?: (d: Date | Date[]) => void;
  onClickDay?: (d: Date) => void;
  calValue?: null | Date | Date[];
  calendarContext: TCalendarContext
}) => {
  
  /******************************************************************************************************************
   * Calendar helper functions
   *****************************************************************************************************************/

   const isTestNotAvailable = false
   const isFirstTimer = false

  const pendingDaysTiles = ({
    activeStartDate,
    date,
    view,
  }: CalendarTileProperties) => {
    let day = calendarContext.userDays.get(date.getTime())
    if (!day) {
      return ""
    }
    return `${day.kind}-${day.status}`.toLowerCase()
  }

  const disabledTiles = ({
    activeStartDate,
    date,
    view,
  }: CalendarTileProperties) =>
    isTestNotAvailable
      ? date.getDay() === 3
        ? true
        : false
      : isFirstTimer
      ? date.getDay() !== 1
      : false;

  const contentTiles = ({
    activeStartDate,
    date,
    view,
  }: CalendarTileProperties) =>
    isTestNotAvailable ? (
      date.getDay() === 3 ? (
        <div>Sold out</div>
      ) : null
    ) : null;

  return (
    <>
        {calendarContext.isLoading ? (
          <>
            <Spinner animation="border" variant="primary" role="status">
              <span className="sr-only"> Loading calendar...</span>
            </Spinner>{" "}
            <div>Loading calendar...</div>
          </>
        ) : (
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
        )}
    </>
  );
};

export default TheCalendar;

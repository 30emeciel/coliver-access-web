import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, DateRangeFocus, DatePickerCalendar, DateRangePickerCalendar } from 'react-nice-dates'
import 'react-nice-dates/build/style.css'
import { Space } from 'antd'

export default function DateRangePickerCalendarExample() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [focus, setFocus] = useState<DateRangeFocus>()
  const handleFocusChange = (newFocus:DateRangeFocus) => {
    setFocus(newFocus)
  }
  const onStartDateChange = (d:Date|null) => {
    if (d) {
      setStartDate(d)
    }
  }

  const onEndDateChange = (d:Date|null) => {
    if (d) {
      setEndDate(d)
    }
  }

  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  const modifiers = {
    selected: (d:Date) => selectedDates.some(selectedDate => isSameDay(selectedDate, d))
  }

   const handleDayClick = (d:Date|null) => {
     if (d) setSelectedDates([...selectedDates, d])
  }

  return (
    <div>
      <p>Selected start date: {startDate ? format(startDate, 'dd MMM yyyy', { locale: fr }) : 'none'}.</p>
      <p>Selected end date: {endDate ? format(endDate, 'dd MMM yyyy', { locale: fr }) : 'none'}.</p>
      <p>Currently selecting: {focus}.</p>

      <Calendar onDayClick={handleDayClick} locale={fr} modifiers={modifiers}/>

      <DatePickerCalendar date={startDate} onDateChange={onStartDateChange} locale={fr} />

      <DateRangePickerCalendar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        locale={fr}
      />

    </div>
  )
}

import { useState } from 'react';
import './BrunaCalendar.css';

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const DAYS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

export default function BrunaCalendar({ onRangeSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Default a Luglio 2026 (Festa della Bruna)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust per Lunedì come primo giorno
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
      onRangeSelect(selectedDate, null);
    } else if (selectedDate < startDate) {
      setStartDate(selectedDate);
      onRangeSelect(selectedDate, null);
    } else {
      setEndDate(selectedDate);
      onRangeSelect(startDate, selectedDate);
    }
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty slots prima dell'inizio del mese
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Giorni reali
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      
      let className = "calendar-day";
      if (startDate && date.getTime() === startDate.getTime()) className += " selected-start";
      if (endDate && date.getTime() === endDate.getTime()) className += " selected-end";
      if (startDate && endDate && date > startDate && date < endDate) className += " in-range";
      
      // Festa della Bruna: 2 Luglio
      if (month === 6 && d === 2) className += " bruna-day";

      days.push(
        <div 
          key={d} 
          className={className} 
          onClick={() => handleDayClick(d)}
        >
          {d}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="bruna-calendar">
      <div className="calendar-header">
        <button className="cal-nav-btn" onClick={handlePrevMonth}>&#10094;</button>
        <span className="cal-month-title">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button className="cal-nav-btn" onClick={handleNextMonth}>&#10095;</button>
      </div>
      
      <div className="calendar-grid">
        {DAYS.map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
        {renderDays()}
      </div>
    </div>
  );
}

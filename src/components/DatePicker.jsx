import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DatePicker.module.css';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export const DatePicker = ({ value, onChange, placeholder = "dd/mm/yyyy" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }
    
    let selYear, selMonth, selDay;
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        selYear = parseInt(parts[0], 10);
        selMonth = parseInt(parts[1], 10) - 1;
        selDay = parseInt(parts[2], 10);
      }
    }

    const today = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = selYear === year && selMonth === month && selDay === i;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i;
      
      days.push(
        <button
          key={i}
          className={`${styles.dayBtn} ${isSelected ? styles.daySelected : ''} ${isToday && !isSelected ? styles.dayToday : ''}`}
          onClick={(e) => { e.stopPropagation(); handleDateClick(i); }}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const displayValue = value ? value.split('-').reverse().join('/') : '';

  return (
    <div className={styles.container} ref={popupRef}>
      <div 
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''} ${!value ? styles.triggerEmpty : ''}`}
        onClick={toggleOpen}
      >
        <span className={styles.triggerText}>{displayValue || placeholder}</span>
        <CalendarIcon size={16} className={styles.icon} />
      </div>

      {isOpen && (
        <div className={styles.popup}>
          <div className={styles.header}>
            <button className={styles.navBtn} onClick={handlePrevMonth}><ChevronLeft size={16}/></button>
            <span className={styles.monthYear}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button className={styles.navBtn} onClick={handleNextMonth}><ChevronRight size={16}/></button>
          </div>
          
          <div className={styles.weekdays}>
            {DAYS.map(d => <span key={d}>{d}</span>)}
          </div>
          
          <div className={styles.daysGrid}>
            {renderCalendar()}
          </div>
          
          <div className={styles.footer}>
            <button className={styles.clearBtn} onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}>Xóa</button>
            <button className={styles.todayBtn} onClick={(e) => { e.stopPropagation(); handleToday(); }}>Hôm nay</button>
          </div>
        </div>
      )}
    </div>
  );
};

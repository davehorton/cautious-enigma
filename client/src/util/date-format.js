
const breakDownDate = (originalDate) => {
  const d = new Date(originalDate);
  let year = d.getFullYear();
  let mon = d.getMonth() + 1;
  let date = d.getDate();
  let hour = d.getHours();
  let min = d.getMinutes();
  let sec = d.getSeconds();
  let ampm = hour < 12 ? 'am' : 'pm';

  mon = mon.toString().padStart(2, 0);
  date = date.toString().padStart(2, 0);
  min = min.toString().padStart(2, 0);
  sec = sec.toString().padStart(2, 0);

  hour = hour === 0
    ? 12
    : hour > 12
      ? hour - 12
      : hour

  return { year, mon, date, hour, min, sec, ampm }
}

const datetime = (date) => {
  const d = breakDownDate(date);
  return `${d.year}-${d.mon}-${d.date} ${d.hour}:${d.min}${d.ampm}`
};

const timeOnly = (date) => {
  const d = breakDownDate(date);
  return `${d.hour}:${d.min}${d.ampm}`
};

const isSameDate = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const d1obj = breakDownDate(d1);
  const d2obj = breakDownDate(d2);
  if (
    (d1obj.year === d2obj.year) &&
    (d1obj.mon === d2obj.mon) &&
    (d1obj.date === d2obj.date)
  ) {
    return true;
  } else {
    return false;
  }
}

const timeDifference = (date1, date2) => {
  if (!date1 || !date2) {
    return false;
  }
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMil = Math.abs(d1 - d2);
  const diffSec = Math.round(diffMil / 1000);
  const days = Math.floor(diffSec / 86400);
  const secAfterDays = diffSec % 86400;
  const hours = Math.floor(secAfterDays / 3600);
  const secAfterHours = secAfterDays % 3600;
  const min = Math.floor(secAfterHours / 60);
  const sec = secAfterHours % 60;
  return `` +
    `${days ? `${days}d ` : ''}` +
    `${hours ? `${hours}h ` : ''}` +
    `${min ? `${min}m ` : ''}` +
    `${sec ? `${sec}s ` : ''}`;
};

export { datetime, timeOnly, timeDifference, isSameDate };

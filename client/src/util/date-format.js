
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
};

const datetime = (date) => {
  if (!date) return false;
  const d = breakDownDate(date);
  return `${d.year}-${d.mon}-${d.date} ${d.hour}:${d.min}${d.ampm}`
};

const timeOnly = (date) => {
  if (!date) return false;
  const d = breakDownDate(date);
  return `${d.hour}:${d.min}${d.ampm}`
};

const timeWithSeconds = (date) => {
  if (!date) return false;
  const d = breakDownDate(date);
  return `${d.hour}:${d.min}:${d.sec}${d.ampm}`
};

const dateOnly = (date) => {
  if (!date) return false;
  const d = breakDownDate(date);
  return `${d.year}-${d.mon}-${d.date}`
};

const isSameDate = (date1, date2) => {
  if (!date1 || !date2) return false;
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
};

const timeDifference = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const milliseconds = Math.abs(d1 - d2);
  const seconds = Math.round(milliseconds / 1000);
  return seconds;
};

const formatTimeDuration = (durationInSeconds, showMilliseconds) => {
  if (parseInt(durationInSeconds) === 0) return '0s';
  if (!durationInSeconds) return false;
  const days = Math.floor(durationInSeconds / 86400);
  const secAfterDays = durationInSeconds % 86400;
  const hours = Math.floor(secAfterDays / 3600);
  const secAfterHours = secAfterDays % 3600;
  const min = Math.floor(secAfterHours / 60);
  const sec = showMilliseconds
    ? Math.round((secAfterHours % 60) * 1000000)/1000000
    : Math.round(secAfterHours % 60);
  return `` +
    `${days ? `${days}d ` : ''}` +
    `${hours ? `${hours}h ` : ''}` +
    `${min ? `${min}m ` : ''}` +
    `${sec ? `${sec}s` : ''}`;
};

const getTimeOffset = (date, offset) => {
  if (!date || !offset) return false;
  const d = new Date(date);
  const updatedDate = d.setSeconds(d.getSeconds() + parseFloat(offset));
  return updatedDate;
};

export {
  datetime,
  timeOnly,
  timeWithSeconds,
  dateOnly,
  isSameDate,
  timeDifference,
  formatTimeDuration,
  getTimeOffset,
};

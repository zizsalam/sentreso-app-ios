import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function nowDakar() {
  return dayjs().tz('Africa/Dakar');
}

export function startOfDakarDay(d?: Date | string | number) {
  const base = d ? dayjs(d) : dayjs();
  return base.tz('Africa/Dakar').startOf('day');
}

export function isSameDakarDay(a: Date | string | number, b: Date | string | number) {
  return dayjs(a).tz('Africa/Dakar').isSame(dayjs(b).tz('Africa/Dakar'), 'day');
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

export function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isTomorrow(dateStr) {
  const d = new Date(dateStr);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.toDateString() === tom.toDateString();
}

export function getDateLabel(dateStr) {
  if (isToday(dateStr)) return '오늘';
  if (isTomorrow(dateStr)) return '내일';
  return formatDate(dateStr);
}

export function getNextDays(count = 7) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

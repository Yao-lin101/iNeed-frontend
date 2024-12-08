import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDeadline = (deadline: string) => {
  const deadlineDate = dayjs(deadline);
  const now = dayjs();
  const today = now.startOf('day');
  const tomorrow = today.add(1, 'day');
  const dayAfterTomorrow = today.add(2, 'day');
  const isThisYear = deadlineDate.year() === now.year();

  // 如果是今天
  if (deadlineDate.isSame(today, 'day')) {
    return `今天 ${deadlineDate.format('HH')}点`;
  }
  
  // 如果是明天
  if (deadlineDate.isSame(tomorrow, 'day')) {
    return `明天 ${deadlineDate.format('HH')}点`;
  }

  // 如果是后天
  if (deadlineDate.isSame(dayAfterTomorrow, 'day')) {
    return `后天 ${deadlineDate.format('HH')}点`;
  }

  // 如果是本年度
  if (isThisYear) {
    return deadlineDate.format('M月D日 HH点');
  }

  // 如果是其他年份
  return deadlineDate.format('YYYY年M月D日 HH点');
}; 
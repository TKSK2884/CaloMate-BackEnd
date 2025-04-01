import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isoWeek from "dayjs/plugin/isoWeek";

// 시간대 추가
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export function getWeekDates(): string[] {
    const today = dayjs();

    const monday = today.startOf("isoWeek"); // 월요일
    const week = [];

    for (let i = 0; i < 7; i++) {
        week.push(monday.add(i, "day").format("YYYY-MM-DD"));
    }

    return week;
}

export function getKoreanWeekDates(): string[] {
    const monday = dayjs().tz("Asia/Seoul").startOf("isoWeek");
    const week: string[] = [];

    for (let i = 0; i < 7; i++) {
        week.push(monday.add(i, "day").format("YYYY-MM-DD"));
    }

    return week;
}

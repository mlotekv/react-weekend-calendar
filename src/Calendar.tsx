import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import Badge from '@mui/material/Badge';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';

// import { setDefaultOptions } from 'date-fns';
// import { ru } from 'date-fns/locale';

// setDefaultOptions({ locale: ru, weekStartsOn:3 });

function getPrevWeeken(startDate: Dayjs, endDate: Date): number[] {
    let datesArray: Date[] = [];
    endDate.setDate(endDate.getDate() - 1);
    while (endDate >= startDate.toDate()) {
        for (let i = 0; i < 2; i++) {
            endDate.setDate(endDate.getDate() - 1);
            datesArray.push(new Date(endDate));
        }
        endDate.setDate(endDate.getDate() - 2);
    }
    datesArray = datesArray.filter(el => el.getMonth() == startDate.month());
    return datesArray.map(el => el.getDate());
}

function getWekend(startDate: Date, endDate: Dayjs): number[] {
    let datesArray: Date[] = [];
    let currentDate = new Date(startDate),
        futureDate = endDate.toDate();
    futureDate.setMonth(futureDate.getMonth() + 1, 0);
    while (currentDate <= futureDate) {
        for (let i = 0; i < 2; i++) {
            currentDate.setDate(currentDate.getDate() + 1);
            datesArray.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 2);
    }
    datesArray = datesArray.filter(el => el.getMonth() == endDate.month());
    return datesArray.map(el => el.getDate());
}

function fetchWeekend(date: Dayjs, lastKnownWeekend: Date) {
    return new Promise<{ daysToHighlight: number[] }>((resolve) => {
        // const lastKnownWeekend = new Date('2023-10-15'); // Пример последнего известного выходного.
        let arr_dates = getWekend(lastKnownWeekend, date)
        if (date.month() == lastKnownWeekend.getMonth() || date.toDate() < lastKnownWeekend)
            arr_dates.push(...getPrevWeeken(date, lastKnownWeekend))
        resolve({ daysToHighlight: arr_dates });
    });
}

const initialValue = dayjs(Date.now());

function ServerDay(props: PickersDayProps<Dayjs> & { highlightedDays?: number[] }) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
    const isSelected =
        !props.outsideCurrentMonth && highlightedDays.indexOf(props.day.date()) >= 0;
    return (
        <Badge
            key={props.day.toString()}
            overlap="circular"
            badgeContent={isSelected ? '' : undefined}
        >
            <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} selected={isSelected} />
        </Badge>
    );
}

export default function DateCalendarServerRequest() {
    const requestAbortController = React.useRef<AbortController | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [highlightedDays, setHighlightedDays] = React.useState([1, 2, 15]);

    let _date = localStorage.getItem("lastKnownWeekend");
    const [selectDate, setSelectDate] = React.useState(_date != "" ? new Date(_date?.toString() || "") : new Date());

    const fetchHighlightedDays = (date: Dayjs) => {
        if (selectDate != null)
            fetchWeekend(date, selectDate)
                .then(({ daysToHighlight }) => {
                    setHighlightedDays(daysToHighlight);
                    setIsLoading(false);
                })
    };

    React.useEffect(() => {
        fetchHighlightedDays(initialValue);
        return () => requestAbortController.current?.abort();
    }, [selectDate]);

    const handleMonthChange = (date: Dayjs) => {
        if (requestAbortController.current)
            requestAbortController.current.abort();
        setIsLoading(true);
        setHighlightedDays([]);
        fetchHighlightedDays(date);
    };

    const onChangeWeekendDay = (value: any) => {
        let selectDate: Date = value.$d;
        setSelectDate(value.$d)
        localStorage.setItem("lastKnownWeekend", selectDate.toISOString());
    }
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <DatePicker
            
                defaultValue={dayjs(selectDate)}
                label="Крайний выходной"
                onChange={onChangeWeekendDay}
                slotProps={{
                    textField: {
                        helperText: 'MM/DD/YYYY',
                    },
                }} />
            <DateCalendar
              
                defaultValue={initialValue}
                loading={isLoading}
                onMonthChange={handleMonthChange}
                renderLoading={() => <DayCalendarSkeleton />}
                slots={{
                    day: ServerDay,
                }}
                slotProps={{
                    day: {
                        highlightedDays,
                    } as any,
                }}
            />
        </LocalizationProvider>
    );
}

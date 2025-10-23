import React, { useCallback, useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Controller } from 'react-hook-form';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// 扩展dayjs功能
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CDateTimePicker = ({
    size = "small",
    label = "",
    name,
    control,
    defaultValue,
    rules,
    sx,
    props,
    minDate,
    maxDate,
    disablePast = false,
    disableFuture = false,
    disabled = false,
    onChange
}) => {
    // 1. 先定义resolveDefaultValue函数
    const resolveDefaultValue = () => {
        if (!defaultValue) return null;
        return dayjs(defaultValue).isValid() ? dayjs(defaultValue) : null;
    };

    // 2. 初始化localValue
    const [localValue, setLocalValue] = useState(resolveDefaultValue());

    // 错误提示处理
    const getInputHelperText = useCallback((error) => {
        if (!error) return '';
        const errorMap = {
            required: 'This field is required',
            minDate: 'Date & time must be on or after minimum',
            maxDate: 'Date & time must be on or before maximum',
        };
        return error.message || errorMap[error.type] || 'Invalid date & time';
    }, []);

    // 处理日期变更
    const handleChange = (date, field) => { // 接收field参数
        const formatted = date ? date.format('YYYY-MM-DD HH:mm:ss') : null;
        if (control) {
            // 受控模式（react-hook-form）：通过field.onChange更新
            field.onChange(formatted);
        } else {
            // 非受控模式
            setLocalValue(date);
            if (typeof onChange === 'function') {
                onChange(formatted);
            }
        }
    };

    // 受控模式渲染
    if (control) {
        return (
            <Controller
                name={name}
                control={control}
                defaultValue={resolveDefaultValue()}
                rules={{
                    validate: (value) => {
                        if (!value) return true;
                        if (!dayjs(value).isValid()) return 'Invalid date & time format';
                        if (minDate && !dayjs(value).isSameOrAfter(dayjs(minDate))) {
                            return 'Date & time is too early';
                        }
                        if (maxDate && !dayjs(value).isSameOrBefore(dayjs(maxDate))) {
                            return 'Date & time is too late';
                        }
                        return true;
                    },
                    ...rules,
                }}
                render={({ field, fieldState }) => ( // 正确解构field
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            label={label}
                            onChange={(date) => handleChange(date, field)} // 传递field
                            value={field.value ? dayjs(field.value) : null}
                            minDate={disablePast ? dayjs() : (minDate ? dayjs(minDate) : null)}
                            maxDate={disableFuture ? dayjs() : (maxDate ? dayjs(maxDate) : null)}
                            disabled={disabled}
                            format="YYYY-MM-DD HH:mm"
                            slotProps={{
                                textField: {
                                    helperText: getInputHelperText(fieldState.error),
                                    error: fieldState.invalid,
                                    size: size,
                                    sx: {
                                        borderRadius: 1,
                                        minWidth: '200px',
                                        '& .MuiInputBase-input': {
                                            padding: '6px 12px',
                                            fontSize: '0.875rem',
                                        },
                                        '& .MuiFormLabel-root': {
                                            fontSize: '0.875rem',
                                        },
                                        ...sx,
                                    },
                                },
                                popup: {
                                    sx: {
                                        '& .MuiDateTimePickerContent-root': {
                                            padding: '8px',
                                        },
                                        '& .MuiPickersTimePickerToolbar-root': {
                                            padding: '8px 16px',
                                        },
                                        '& .MuiPickersClockNumber-root': {
                                            width: '32px',
                                            height: '32px',
                                            fontSize: '0.875rem',
                                        },
                                    },
                                },
                                actionBar: {
                                    actions: ['clear', 'cancel', 'accept'],
                                    sx: {
                                        padding: '4px 8px',
                                    },
                                },
                            }}
                            {...props}
                        />
                    </LocalizationProvider>
                )}
            />
        );
    }

    // 非受控模式渲染
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
                label={label}
                onChange={handleChange}
                value={localValue}
                minDate={disablePast ? dayjs() : (minDate ? dayjs(minDate) : null)}
                maxDate={disableFuture ? dayjs() : (maxDate ? dayjs(maxDate) : null)}
                disabled={props?.disabled || false}
                format="YYYY-MM-DD HH:mm"
                slotProps={{
                    textField: {
                        size: size,
                        sx: {
                            borderRadius: 1,
                            minWidth: '200px',
                            '& .MuiInputBase-input': {
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                            },
                            '& .MuiFormLabel-root': {
                                fontSize: '0.875rem',
                            },
                            ...sx,
                        },
                    },
                    popup: {
                        sx: {
                            '& .MuiDateTimePickerContent-root': {
                                padding: '8px',
                            },
                            '& .MuiPickersTimePickerToolbar-root': {
                                padding: '8px 16px',
                            },
                            '& .MuiPickersClockNumber-root': {
                                width: '32px',
                                height: '32px',
                                fontSize: '0.875rem',
                            },
                        },
                    },
                    actionBar: {
                        actions: ['clear', 'cancel', 'accept'],
                        sx: {
                            padding: '4px 8px',
                        },
                    },
                }}
                {...props}
            />
        </LocalizationProvider>
    );
};

export default CDateTimePicker;
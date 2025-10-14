import React, { useCallback } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // 引入日期比较插件

// 扩展dayjs功能
dayjs.extend(isSameOrAfter);

const CDatePicker = ({
    size = "small",
    label = "",
    name,
    control,
    defaultValue,
    rules,
    sx,
    props,
    minDate, // 新增：最小可选日期
    maxDate, // 新增：最大可选日期
    disablePast = false, // 新增：是否禁用过去日期
    disableFuture = false, // 新增：是否禁用未来日期
}) => {
    // 错误提示处理（支持更多错误类型）
    const getInputHelperText = useCallback((error) => {
        if (!error) return '';
        // 常见错误类型映射
        const errorMap = {
            required: 'This field is required',
            minDate: 'Date must be on or after minimum date',
            maxDate: 'Date must be on or before maximum date',
        };
        return error.message || errorMap[error.type] || 'Invalid date';
    }, []);

    // 处理默认值：支持字符串/时间戳/dayjs对象
    const resolveDefaultValue = () => {
        if (!defaultValue) return null;
        // 若传入的是字符串或数字，转为dayjs对象
        return dayjs(defaultValue).isValid() ? dayjs(defaultValue) : null;
    };

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={resolveDefaultValue()}
            rules={{
                // 自动添加日期有效性校验（结合传入的rules）
                validate: (value) => {
                    // 空值校验交给required规则
                    if (!value) return true;
                    // 验证日期有效性
                    if (!dayjs(value).isValid()) return 'Invalid date format';
                    // 最小日期校验
                    if (minDate && !dayjs(value).isSameOrAfter(dayjs(minDate))) {
                        return 'Date is too early';
                    }
                    // 最大日期校验
                    if (maxDate && !dayjs(value).isSameOrBefore(dayjs(maxDate))) {
                        return 'Date is too late';
                    }
                    return true;
                },
                ...rules, // 合并用户传入的规则
            }}
            render={({ field, fieldState }) => (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label={label}
                        //  onChange返回格式化字符串（YYYY-MM-DD），而非dayjs对象
                        onChange={(date) => {
                            field.onChange(date ? date.format('YYYY-MM-DD') : null);
                        }}
                        // 显示值处理：支持字符串/dayjs对象
                        value={field.value ? dayjs(field.value) : null}
                        // 日期限制配置
                        minDate={disablePast ? dayjs() : (minDate ? dayjs(minDate) : null)}
                        maxDate={disableFuture ? dayjs() : (maxDate ? dayjs(maxDate) : null)}
                        // 禁用无效日期
                        disabled={props?.disabled || false}
                        format="YYYY-MM-DD"
                        slotProps={{
                            textField: {
                                helperText: getInputHelperText(fieldState.error),
                                error: fieldState.invalid,
                                size: size,
                                // 优化焦点状态样式
                                sx: {
                                    borderRadius: 1,
                                    minWidth: '140px',
                                    '& .MuiInputBase-input': {
                                        padding: '6px 12px',
                                        fontSize: '0.875rem',
                                        '&:focus': {
                                            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)', // 轻微焦点高亮
                                        },
                                    },
                                    '& .MuiFormLabel-root': {
                                        fontSize: '0.875rem',
                                        '&.Mui-focused': {
                                            color: 'primary.main', // 聚焦时标签颜色
                                        },
                                    },
                                    '& .MuiFormHelperText-root': {
                                        fontSize: '0.75rem',
                                        margin: '4px 0 0 0',
                                    },
                                    ...sx,
                                },
                            },
                            // 日历弹窗优化
                            popup: {
                                sx: {
                                    '& .MuiPickersCalendarHeader': {
                                        padding: '8px', // 头部内边距压缩
                                    },
                                    '& .MuiPickersCalendarHeader-label': {
                                        fontSize: '0.875rem',
                                    },
                                    '& .MuiPickersDay-root': {
                                        width: '24px',
                                        height: '24px',
                                        fontSize: '0.75rem',
                                        '&.Mui-selected': {
                                            fontSize: '0.8125rem', // 选中日期稍大
                                        },
                                    },
                                    '& .MuiPickersMonth-root': {
                                        fontSize: '0.75rem',
                                        padding: '4px',
                                    },
                                    '& .MuiPickersYear-root': {
                                        fontSize: '0.75rem',
                                        height: '32px',
                                    },
                                },
                            },
                            // 底部按钮优化
                            actionBar: {
                                actions: ['clear'],
                                sx: {
                                    padding: '4px 8px',
                                    '& .MuiButton-root': {
                                        fontSize: '0.75rem',
                                        padding: '4px 8px',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    },
                                },
                            },
                        }}
                        {...props}
                    />
                </LocalizationProvider>
            )}
        />
    );
};

export default CDatePicker;
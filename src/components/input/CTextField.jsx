import React, { useCallback } from 'react';
import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

const getFormErrorMessage = (errorType) => {
    switch (errorType) {
        case 'required':
            return 'This field is required';
        default:
            return 'Error';
    }
};

const CTextField = ({
    id,
    name,
    label = '',
    placeholder,
    variant = 'outlined',
    size = 'small',
    type,
    sx,
    control,
    rules,
    defaultValue,
    value,
    renderController = true,
    ...props
}) => {
    if (renderController) {
        const getInputHelperText = useCallback((error) => {
            return !error ? '' : error.message || getFormErrorMessage(error.type);
        }, []);

        return (
            <Controller
                control={control}
                name={name}
                defaultValue={defaultValue ? defaultValue : type === 'number' && !label ? 0 : ''}
                rules={rules}
                render={({ field, fieldState }) => (
                    <TextField
                        id={id}
                        label={label}
                        name={id}
                        variant={variant}
                        placeholder={placeholder}
                        type={type}
                        size={size}
                        {...field}
                        sx={{ borderRadius: 2, ...sx }}
                        error={!!fieldState.invalid}
                        onKeyDown={(event) => {
                            event.stopPropagation();
                        }}
                        
                        helperText=  {!fieldState.invalid ? " " : getInputHelperText(fieldState.error)}

                        {...props}
                    />
                )}
            />
        );
    }

    return (
        <TextField
            id={id}
            label={label}
            name={id}
            variant={variant}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            type={type}
            size={size}
            sx={{ borderRadius: 2, ...sx }}
            {...props}
        />
    );
};

export default CTextField;

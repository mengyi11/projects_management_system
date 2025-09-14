import React from 'react';
import { Button } from '@mui/material';

const CButton = ({
    size = "large",
    fullWidth,
    type = "submit",
    color,
    isSubmitting,
    onClick,
    variant = "contained",
    children,
    underline,
    sx,
    ...props
}) => {
    return (
        <Button
            size={size}
            fullWidth={fullWidth}
            type={type}
            color={color ? color : type === "submit" ? "primary" : "secondary"}
            loading={isSubmitting}
            variant={variant}
            onClick={onClick}
            sx={{ textDecoration: underline ? "underline" : "", paddingX: underline && 0, ...sx }}
            {...props}
        >
            {children}
        </Button>
    );
}

export default CButton;

import React from 'react';
import { LoadingButton } from '@mui/lab';

const ClickLoadingButton = ({ size = "large", fullWidth, isSubmitting, onClick, text, ...props }) => {

    return (
        <LoadingButton
            size={size}
            fullWidth={fullWidth}
            type="submit"
            color="primary"
            loading={isSubmitting}
            variant="contained"
            onClick={onClick}
            {...props}
        >
            <span style={{ fontWeight: 'bold' }}>{text}</span>
        </LoadingButton>
    );
};

export default ClickLoadingButton;

import React from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

interface SpecInputProps extends Omit<TextFieldProps, 'variant' | 'size'> {
    readOnly?: boolean;
    centered?: boolean;
    inputStyle?: React.CSSProperties;
}

const SpecInput: React.FC<SpecInputProps> = ({
    readOnly = false,
    centered = true,
    inputStyle,
    inputProps,
    sx,
    ...props
}) => {
    return (
        <TextField
            {...props}
            variant="outlined"
            size="small"
            fullWidth
            inputProps={{
                ...inputProps,
                style: {
                    textAlign: centered ? 'center' : 'left',
                    fontFamily: 'Roboto Mono',
                    fontSize: '0.85rem',
                    ...inputStyle,
                    ...inputProps?.style
                }
            }}
            sx={{
                minWidth: "70px",
                "& .MuiOutlinedInput-root": {
                    backgroundColor: readOnly ? "#f8fafc" : "#fff"
                },
                ...sx
            }}
        />
    );
};

export default SpecInput;

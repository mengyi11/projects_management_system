import React from 'react'
import { TextField, InputAdornment } from '@mui/material'
import iconMap from '@/styles/iconMap';


const SearchIcon = iconMap["Search"];

const SearchBar = ({
    id = "searchInput",
    label = "search...",
    variant = "outlined",
    size = "small",
    fullWidth,
    type,
    onChange,
    sx,
    ...props
}) => {
    return (
        <TextField
            id={id}
            label={label}
            name={id}
            variant={variant}
            fullWidth={fullWidth}
            type={type}
            size={size}
            onChange={onChange}
            sx={{ borderRadius: 2, ...sx }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
            {...props}
        />
    )
}

export default SearchBar

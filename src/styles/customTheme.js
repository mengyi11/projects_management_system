import React from 'react'
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { red, grey } from "@mui/material/colors";
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';

let customTheme = createTheme({
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0.5rem',
                    boxShadow: 'none',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 'inherit',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: 'black',
                    transition: 'all 0.3s',
                    '&:hover': {
                        backgroundColor: '#c7cce3ff',
                        color: 'white',
                    },
                    '&.Mui-selected': {
                        backgroundColor: '#d1d3dbff',
                        color: 'white',
                        opacity: 1,
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    '&:focus': {
                        backgroundColor: 'transparent',
                    },
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.3s',
                    '&:hover': {
                        color: '#000000dd',
                    },
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                listbox: {
                    '& .MuiAutocomplete-option:hover': {
                        backgroundColor: '#3D9DB3',
                        color: 'white',
                    },
                },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    '& .MuiDataGrid-row:not(.MuiDataGrid-row--dynamicHeight) > .MuiDataGrid-cell': {
                        whiteSpace: 'unset',
                        wordWrap: 'break-word',
                    },
                },
                columnHeader: {
                    backgroundColor: '#F3F3FA',
                },
                columnHeaderTitle: {
                    fontWeight: 'bold'
                },
                row: {
                    transition: 'all 0.3s',
                    '&:nth-of-type(even)': {
                        backgroundColor: '#fbf9fc',
                    },
                    '&:nth-of-type(odd)': {
                        backgroundColor: '#fbf9fc',
                    },
                    '&:hover': {
                        backgroundColor: '#ecececff',
                    },
                },

            },
        },
    },
    typography: {
        fontFamily: 'Inter, Arial, sans-serif',
        // fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: {
            fontWeight: 700,
            fontSize: '2.25rem',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 700,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 700,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 700,
            fontSize: '1.0rem',
        },
        body1: {
            fontWeight: 500,
        },
        button: {
            fontWeight: 500,
            textTransform: 'none'
        },
        dashTitle: {
            fontWeight: 1000,
            fontSize: '1.1rem',
        },
        nav: {
            fontSize: '0.8rem',

        }
    },
    palette: {
        background: {
            default: '#fafaffff',
            paper: '#f7f5f9',
        },
        primary: {
            main: "#31326F",
            contrastText: "#fff",
        },
        secondary: {
            main: "#57576aff",
            contrastText: "#fff",
        },
        error: {
            main: red[500],
        },
        error2: {
            main: '#f56c6c',
            contrastText: "#fff",
        },
        white: {
            main: '#ffffff',
            contrastText: "#000",
        },
        color1: {
            main: '#636363ff'
        },
        color2: {
            main: '#536dfe'
        }
    },
});

customTheme = responsiveFontSizes(customTheme);

export default customTheme

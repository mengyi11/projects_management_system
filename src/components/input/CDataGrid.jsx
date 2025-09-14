import { useCallback, useEffect, useState } from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarDensitySelector, gridClasses, useGridApiRef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
// import CButton from '../button/CButton';
// import RestartAltIcon from '@mui/icons-material/RestartAlt';

const CDataGrid = ({ rows, columns, startingPageSize, pageSizeOptions = [], showHeader, striped = true, onRowsChange, autoHeight = true, ...props }) => {
    const apiRef = useGridApiRef();
    const [sortModel, setSortModel] = useState([]);

    const [pagination, setPagination] = useState({
        paginationModel: { page: 0, pageSize: startingPageSize ? startingPageSize : (pageSizeOptions.length > 0 ? pageSizeOptions[0] : rows.length) },
    });

    const handlePageChange = (params) => {
        setPagination((prevPagination) => ({
            ...prevPagination,
            paginationModel: { ...prevPagination.paginationModel, page: params.page },
        }));
    };

    const handlePageSizeChange = (params) => {
        setPagination((prevPagination) => ({
            ...prevPagination,
            paginationModel: { ...prevPagination.paginationModel, pageSize: params.pageSize },
        }));
    };

    const handleSortModelChange = useCallback((model) => {
        setSortModel(model);
    }, []);

    const StyledCDataGrid = styled(DataGrid)(({ theme }) => ({
        [`& .${gridClasses.row}.odd`]: {
            backgroundColor: theme.palette.grey[100],
        },
        [`& .${gridClasses.row}`]: {
            "&:hover, &.Mui-hovered": {
                backgroundColor: theme.palette.grey[200],
                "@media (hover: none)": {
                    backgroundColor: "transparent",
                },
            },
        },
        [`& .${gridClasses.row}.module`]: {
            backgroundColor: theme.palette.grey[100],
            fontWeight: 'bold',
        },
        [`& .${gridClasses.row}.bold`]: {
            fontWeight: 'bold',
        },
        [`& .${gridClasses.cell}`]: {
            padding: `${theme.spacing(1)}`,
        },
        [`& .${gridClasses.cell}.staff`]: {
            backgroundColor: theme.palette.grey[100],
            justifyContent: 'center',
            fontWeight: 'bold',
        },
        [`& .${gridClasses.cell}.staffHours`]: {
            fontWeight: 'bold',
            '&:nth-of-type(2)': {
                justifyContent: 'center',
            }
        },
        [`& .${gridClasses.cell}.centerAligned`]: {
            justifyContent: 'center',
            textAlign: 'center',
        },
        [`& .${gridClasses.cell}.red`]: {
            color: theme.palette.error.main,
        },
        [`& .${gridClasses.cell}.sameStaff`]: {
            fontWeight: 'bold',
            color: theme.palette.secondary.main,
            justifyContent: 'center',
            textAlign: 'center'
        },
        [`& .${gridClasses.cell}.hrsBold`]: {
            fontWeight: 'bold',
        },
        [`& .${gridClasses.cell}.leftAligned`]: {
            justifyContent: 'left',
            textAlign: 'left',
        },
        [`& .MuiDataGrid-footerContainer .MuiDataGrid-selectedRowCount`]: {
            visibility: 'hidden',
        },
    }));

    const StyledGridToolbarContainer = styled(GridToolbarContainer)(({ theme }) => ({
        backgroundColor: theme.palette.background.default,
        height: 'auto',
    }));

    const updatedPageSizeOptions = [...pageSizeOptions, 100];

    useEffect(() => {
        if (rows && rows.length > 0 && onRowsChange) {
            let sortedRows = apiRef.current.getSortedRows();
            onRowsChange(sortedRows);
        }
    }, [sortModel]);

    return (
        <>
            <StyledCDataGrid
                apiRef={apiRef}
                autoHeight={autoHeight}
                columns={columns}
                disableColumnFilter
                disableColumnMenu
                disableColumnSelector
                disableDensitySelector
                disableRowSelectionOnClick
                getRowClassName={(params) => (
                    striped ? params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd' : '' ||
                        params.row.bold ? 'module' : '' ||
                            params.row.head === 'Classes and Hours By LTP:' ? 'bold' : '' ||
                                params.row.head === 'Grand Total Hours:' ? 'bold' : ''
                )}
                getCellClassName={(params) => (
                    params.field !== 'head' && !striped ? 'centerAligned' : ''
                )}
                getRowHeight={() => 'auto'}
                initialState={startingPageSize ? { pagination } : null}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSortModelChange={handleSortModelChange}
                onRowsChange={onRowsChange}
                page={pagination.paginationModel.page}
                pageSize={pagination.paginationModel.pageSize}
                pageSizeOptions={updatedPageSizeOptions.length > 0 ? updatedPageSizeOptions : null}
                rows={rows}
                showHeader={showHeader}
                slots={{
                    toolbar: showHeader ? StyledGridToolbarContainer : null,
                }}
                sortModel={sortModel}
                {...props}
            />
        </>
    );
};

export default CDataGrid;
import { DataGrid } from '@mui/x-data-grid';

const CDataGrid = ({
  rows,
  columns,
  showHeader = true,
  hidefooter = false,
  pageSizeOptions = [5, 10, 20],
  autoHeight = true,
  ...props
}) => {
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      autoHeight={autoHeight}
      showHeader={showHeader}
      hideFooter={hidefooter}
      pageSizeOptions={pageSizeOptions}
      disableRowSelectionOnClick
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: pageSizeOptions[0],
          },
        },
      }}
      sx={{ width: '100%' }}
      {...props}
    />
  );
};

export default CDataGrid;
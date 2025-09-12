'use client';

import React, { useState, useEffect } from "react";
import { Grid, Typography, IconButton } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/styles/iconMap';
import SearchBar from "@/components/SearchBar";
import ClickButton from "@/components/ClickButton";
import { useRouter, usePathname } from "next/navigation";


export default function ManageFaculty() {
  const currentPathArr = ['Admin', 'User', 'Manage Faculty'];
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const RemoveIcon = iconMap["Remove"];
  const router = useRouter();
  const pathname = usePathname();

  const handleCreateFaculty = () => {
    router.push(`${pathname}/CreateFaculty`);
  };

  const dummyData = [
    { id: 812, name: "Prof. Yong Sik", email: "etoux0222@ntu.edu.sg", role: "Faculty" },
    { id: 750, name: "Vanessa Valentino", email: "vvalent000@e.ntu.edu.sg", role: "Faculty" },
    { id: 800, name: "SUPER ADMIN REDEMSON", email: "redemson@outlook.com", role: "Faculty" },
    { id: 848, name: "Assoc. Prof. Michael Schiwald", email: "l000793@e.ntu.edu.sg", role: "Faculty" },
    { id: 856, name: "Matthew Gitaka", email: "mgitaka001@ntu.edu.sg", role: "Faculty" },
    { id: 818, name: "Dr. James Bartley", email: "bartleyj@ntu.edu.sg", role: "Faculty" },
    { id: 876, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
    { id: 888, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
    { id: 899, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
    { id: 834, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
    { id: 822, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
    { id: 811, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
    { id: 877, name: "Prof. Stanley Wong", email: "swong778@ntu.edu.sg", role: "Faculty" },
  ];

  useEffect(() => {
    setRows(dummyData);
    setIsLoading(false);
  }, []);

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5, minWidth: 50 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 100 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 100 },
    { field: "role", headerName: "Role", flex: 1, minWidth: 100 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 50,
      sortable: false,
      renderCell: (cellValues) => (
        <>
          {/* <Button underline onClick={(event) => { handleEditClick(event, cellValues) }}>Edit</Button> */}
          {/* <Button underline color="error" onClick={(event) => { handleDeleteClick(event, cellValues) }}>Delete</Button> */}
          <IconButton aria-label="delete" >
            <RemoveIcon color="error" />
          </IconButton>
        </>
      ),
    },
  ];
  return (
    <AdminLayout pathArr={currentPathArr}>


      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, md: 6 }} >
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Typography variant="h5">Faculty List</Typography>
            </Grid>
            <Grid item>
              <SearchBar onChange={(event) => handleSearchChange(event)} />
            </Grid>
          </Grid>
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <ClickButton onClick={handleCreateFaculty} fullWidth >
                Create Faculty
              </ClickButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          sx={{ width: '100%' }}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
        />
      </Grid>
    </AdminLayout>
  );
}
import React, { useEffect } from "react";
import {
  Typography, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, Divider, Paper,
  FormControlLabel, Checkbox,
  Select
} from "@mui/material";
import CButton from "@/components/input/CButton";
import CTextField from "@/components/input/CTextField";
import CDatePicker from "@/components/input/CDateTimePicker";
import CSelect from "@/components/input/CSelect"; // 假设存在下拉选择组件
import dayjs from 'dayjs';

const SemesterForm = ({
  type,
  title,
  data,
  onSubmit,
  open,
  onClose,
  handleSubmit,
  control,
  reset,
}) => {
  // 生成最近5年的学年选项
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year, label: `${year}` };
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset, type]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll='paper'
      aria-labelledby="dialog-title"
      sx={{
        '& .MuiDialog-paper': {
          width: '600px',
          maxWidth: '95vw',
          padding: '16px',
        },
      }}
    >
      <DialogTitle id="dialog-title" variant="h5" sx={{ mb: 1 }}>
        {type === 'create' ? 'Create New Semester' : 'Update Semester'}
      </DialogTitle>

      <Typography variant="body2" color="text.secondary" sx={{ pl: 3, mb: 2 }}>
        {type === 'create'
          ? 'Add a new semester to the system'
          : 'Update the semester details below'}
      </Typography>

      <DialogContent dividers={true} tabIndex={-1} sx={{ p: 2 }}>
        <Paper elevation={2}
          sx={{
            padding: 3,
            width: "100%",
            borderRadius: 2,
          }}>
          <Grid container rowSpacing={3} columnSpacing={2}>
            {/* 标题与分隔线 */}
            <Grid item size sx={{ mb: 1 }}>
              <Typography variant="h6">{type === 'create' ? 'Semester' : title} Info:</Typography>
              <Divider />
            </Grid>

            {/* 学年选择 */}
            <Grid container item size={{ xs: 12 }} alignItems="center" spacing={2}>
              <Grid item size={{ xs: 12, md: 3 }}>
                <Typography>Academic Year</Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 9 }}>
                {/* <Select
                  fullWidth
                  id="academicYear"
                  name="academicYear"
                  control={control}
                  defaultValue={data?.academicYear || new Date().getFullYear()}
                  options={academicYears}
                  rules={{ required: "Academic Year is required" }}
                /> */}
                <CTextField
                  label="Amount"
                  type="number"
                  id="academicYear"
                  name="academicYear"
                  placeholder="Enter Academic Year"
                  rules={{ required: "Academic Year is required" }}
                  inputProps={{ min: 2000, max: 2100, step: 1, }}
                  // options={academicYears}
                  // value={data?.academic_year || new Date().getFullYear()}
                  // onChange={(e) => setValue(e.target.value)}
                  defaultValue={data?.academic_year || new Date().getFullYear()}
                  control={control}
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* 学期名称 */}
            <Grid container item size={{ xs: 12 }} alignItems="center" spacing={2}>
              <Grid item size={{ xs: 12, md: 3 }} >
                <Typography>Semester Name:</Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 9 }}>
                <CTextField
                  fullWidth
                  id="semName"
                  name="semName"
                  placeholder="e.g. Fall Semester"
                  defaultValue={data?.name || ''}
                  control={control}
                  rules={{ required: "Semester Name is required" }}
                />
              </Grid>
            </Grid>

            {/* 容量设置 */}
            <Grid container item size={{ xs: 12 }} spacing={2}>
              <Grid item size={{ xs: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Capacity:</Typography>
              </Grid>
              <Grid item size={{ xs: 12, md: 4.5 }} sx={{ pr: 1 }}>
                <CTextField
                  fullWidth
                  id="minCapacity"
                  name="minCapacity"
                  label="Minimum"
                  type="number"
                  defaultValue={data?.min_cap || 20}
                  control={control}
                  inputProps={{ min: 0 }}
                  rules={{ required: "Minimum capacity is required" }}
                />
              </Grid>
              <Grid item size={{ xs: 12, md: 4.5 }} sx={{ pl: 1 }}>
                <CTextField
                  fullWidth
                  id="maxCapacity"
                  name="maxCapacity"
                  label="Maximum"
                  type="number"
                  defaultValue={data?.max_cap || 100}
                  control={control}
                  inputProps={{ min: 0 }}
                  rules={{ required: "Maximum capacity is required" }}
                />
              </Grid>
            </Grid>

            {/* 提示信息 */}
            {type === 'create' && (
              <Grid item size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  NOTE: New Semesters will be inactive by default.
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
        <CButton
          type="button"
          variant="outlined"
          onClick={onClose}
          sx={{ mr: 1 }}
        >
          Cancel
        </CButton>
        <CButton
          onClick={(e) => handleSubmit(onSubmit)(e)}
          variant="contained"
        >
          {type === 'create' ? 'Create Semester' : 'Save Changes'}
        </CButton>
      </DialogActions>
    </Dialog>
  );
};

export default SemesterForm;
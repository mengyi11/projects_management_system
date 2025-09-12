'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { TextField, Button, Box, Typography } from '@mui/material';
import { ToastContainer, toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.endsWith('@e.ntu.edu.sg')) {
      toast.error("Only NTU student emails (@e.ntu.edu.sg) are allowed!");
      return;
    }

    try {
      const res = await axios.post('/api/login', { email });
      const { statusCode, message, ok, role_id } = res.data;

      if (ok && statusCode === 200) {
        toast.success("Login successfully");
        if (role_id === 1) {
          router.push('/admin');
        } else if (role_id === 2) {
          router.push('/faculty');
        } else if (role_id === 3) {
          router.push('/student');
        }
      }
    } catch (error) {
      console.log(error);
      let err = error.response?.data || {};
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <ToastContainer position="top-center" />

      <Typography variant="h4" mb={3}>Login</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '300px' }}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </Box>
    </Box>
  );
}
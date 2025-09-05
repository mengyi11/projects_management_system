'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { TextField, Button, Box, Typography } from '@mui/material';
import { ToastContainer, toast } from "react-toastify";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      const { statusCode = [] , message,ok} = res.data;
      // if (res.data.message === 'Login success') {
      //   alert('Login Success');
      //   router.push('/profile'); // 登录成功跳转
      // } else {
      //   alert('Invalid credentials');
      // }
      if ( ok && statusCode === 200 ) {
        toast.success(message);
      }
        // setAuth((prev) => {
        //   return {
        //     ...prev,
        //     groupId: groupId,
        //     isLeader: isLeader,
        //   };
        // });
    } catch (error) {
      let err = error.response.data;
      if (err.statusCode === 400) {
        toast.error(err.message);
      } else if (err.statusCode === 401) {
        toast.error(err.message);
      } else if (err.statusCode === 500) {
        toast.error(err.message);
      }
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
    <ToastContainer position="top-center" className="me-4" />

      <Typography variant="h4" mb={3}>Login</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '300px' }}>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </Box>
    </Box>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Box, Typography } from '@mui/material';
import { toast } from "react-toastify";
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 登录成功后存储用户信息到 localStorage
  const saveUserInfo = (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
    } catch (error) {
      console.error('Failed to save user info:', error);
      toast.warning('Login successful, but failed to save user information');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 邮箱格式校验（仅允许@e.ntu.edu.sg结尾）
    if (!email.endsWith('@e.ntu.edu.sg')) {
      toast.error("Only NTU student emails (@e.ntu.edu.sg) are allowed!");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/login', { email });
      const { statusCode, message, ok, data: userData } = res.data;

      if (ok && statusCode === 200 && userData) {
        // 存储用户信息（适配你的user表字段：id/name/email/role_id）
        saveUserInfo(userData);
        
        toast.success("Login successfully");
        
        // 根据role_id跳转对应页面
        switch (userData.role_id) {
          case 1:
            router.push('/admin');
            break;
          case 2:
            router.push('/faculty');
            break;
          case 3:
            router.push('/student');
            break;
          default:
            toast.warning("Unknown role, redirecting to home");
            router.push('/');
        }
      } else {
        toast.error(message || "Login failed: No user data returned");
      }
    } catch (error) {
      console.log('Login error:', error);
      const errMsg = error.message || error.response?.data?.message || "Login failed";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 已登录则自动跳转
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = localStorage.getItem('user');
    
    if (isLoggedIn && user) {
      const parsedUser = JSON.parse(user);
      switch (parsedUser.role_id) {
        case 1:
          router.push('/admin');
          break;
        case 2:
          router.push('/faculty');
          break;
        case 3:
          router.push('/student');
          break;
      }
    }
  }, [router]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ padding: 2, bgcolor: '#f5f5f5' }}
    >
      <Box sx={{ 
        width: '100%', 
        maxWidth: '400px', 
        bgcolor: 'white', 
        padding: 4, 
        borderRadius: 2, 
        boxShadow: 3 
      }}>
        <Typography variant="h4" mb={3} align="center">Login</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 1, py: 1.2 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
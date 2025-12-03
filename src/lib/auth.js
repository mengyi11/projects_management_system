export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr); // 包含id/name/email/role_id/role_name
  } catch (error) {
    console.error('Failed to get user info:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    return null;
  }
};
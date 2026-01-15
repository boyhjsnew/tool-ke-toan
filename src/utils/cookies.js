import Cookies from 'js-cookie';

const COOKIE_KEYS = {
  USERNAME: 'crm_username',
  PASSWORD: 'crm_password',
  MA_DVCS: 'crm_ma_dvcs',
  TOKEN: 'crm_token',
};

export const cookieUtils = {
  // Lưu thông tin đăng nhập
  saveLoginInfo: (username, password, ma_dvcs) => {
    Cookies.set(COOKIE_KEYS.USERNAME, username, { expires: 30 }); // 30 ngày
    Cookies.set(COOKIE_KEYS.PASSWORD, password, { expires: 30 });
    Cookies.set(COOKIE_KEYS.MA_DVCS, ma_dvcs, { expires: 30 });
  },

  // Lấy thông tin đăng nhập
  getLoginInfo: () => {
    return {
      username: Cookies.get(COOKIE_KEYS.USERNAME) || '',
      password: Cookies.get(COOKIE_KEYS.PASSWORD) || '',
      ma_dvcs: Cookies.get(COOKIE_KEYS.MA_DVCS) || '',
    };
  },

  // Lưu token
  saveToken: (token) => {
    Cookies.set(COOKIE_KEYS.TOKEN, token, { expires: 1 }); // 1 ngày
  },

  // Lấy token
  getToken: () => {
    return Cookies.get(COOKIE_KEYS.TOKEN) || '';
  },

  // Xóa tất cả thông tin
  clearAll: () => {
    Object.values(COOKIE_KEYS).forEach(key => {
      Cookies.remove(key);
    });
  },

  // Kiểm tra đã đăng nhập chưa
  isLoggedIn: () => {
    const loginInfo = cookieUtils.getLoginInfo();
    return !!(loginInfo.username && loginInfo.password && loginInfo.ma_dvcs);
  },
};

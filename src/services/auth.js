import { cookieUtils } from "../utils/cookies";

const API_BASE_URL = "https://admin.minvoice.com.vn/api";

/**
 * Đăng nhập và lấy token
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @param {string} ma_dvcs - Mã đơn vị cơ sở
 * @returns {Promise<{token: string}>}
 */
export const login = async (username, password, ma_dvcs) => {
  try {
    const url = `${API_BASE_URL}/Account/Login`;
    const body = {
      username: username,
      password: password,
      ma_dvcs: ma_dvcs,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.token) {
      // Lưu token và thông tin đăng nhập vào cookie
      cookieUtils.saveToken(data.token);
      cookieUtils.saveLoginInfo(username, password, ma_dvcs);
      return data;
    } else {
      throw new Error("Token not found in response");
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Tự động đăng nhập lại từ thông tin đã lưu trong cookie
 * @returns {Promise<{token: string}>}
 */
export const autoLogin = async () => {
  const loginInfo = cookieUtils.getLoginInfo();

  if (!loginInfo.username || !loginInfo.password || !loginInfo.ma_dvcs) {
    throw new Error("No saved login information found");
  }

  return await login(loginInfo.username, loginInfo.password, loginInfo.ma_dvcs);
};

/**
 * Lấy token hiện tại, nếu không có hoặc hết hạn thì tự động đăng nhập lại
 * @returns {Promise<string>}
 */
export const getValidToken = async () => {
  let token = cookieUtils.getToken();

  // Nếu không có token, thử đăng nhập lại
  if (!token) {
    const loginData = await autoLogin();
    token = loginData.token;
  }

  return token;
};

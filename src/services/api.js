import { getValidToken } from "./auth";

// Dùng full URL vì proxy có thể không hoạt động
const API_BASE_URL = "https://admin.minvoice.com.vn/api";

/**
 * API client với tự động refresh token
 * @param {string} endpoint - Endpoint API (không bao gồm base URL)
 * @param {RequestInit} options - Options cho fetch request
 * @returns {Promise<Response>}
 */
export const apiCall = async (endpoint, options = {}) => {
  try {
    // Lấy token hợp lệ (tự động đăng nhập lại nếu cần)
    const token = await getValidToken();

    // Merge headers - không set Content-Type cho GET request
    const defaultHeaders = {
      Authorization: `Bear ${token};VP`,
      "sec-ch-ua-platform": '"macOS"',
      Referer: "https://admin.minvoice.com.vn/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
    };

    // Chỉ thêm Content-Type cho POST/PUT requests
    if (options.method && ["POST", "PUT", "PATCH"].includes(options.method)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log("API Call:", {
      url: fullUrl.substring(0, 200),
      method: options.method || "GET",
      hasToken: !!token,
    });

    // Gọi API với CORS mode - dùng credentials: 'include' như trong curl example
    let response;
    try {
      response = await fetch(fullUrl, {
        ...options,
        mode: "cors",
        credentials: "include", // Thay đổi từ 'omit' sang 'include'
        headers,
      });
    } catch (fetchError) {
      console.error("Fetch error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
      throw fetchError;
    }

    // Nếu token hết hạn (401), thử đăng nhập lại và gọi lại API
    if (response.status === 401) {
      // Xóa token cũ (nhưng giữ thông tin đăng nhập)
      const { cookieUtils } = await import("../utils/cookies");
      const { autoLogin } = await import("./auth");
      cookieUtils.saveToken(""); // Xóa token cũ

      // Đăng nhập lại và lấy token mới
      const loginResult = await autoLogin();
      const newToken = loginResult.token;

      // Gọi lại API với token mới
      headers["Authorization"] = `Bear ${newToken};VP`;
      return await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        mode: "cors",
        credentials: "include",
        headers,
      });
    }

    // Kiểm tra nếu response không ok
    if (!response.ok && response.status !== 401) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    return response;
  } catch (error) {
    // Xử lý lỗi CORS hoặc network
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("CORS or Network error:", error);
      throw new Error(
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc CORS policy."
      );
    }
    console.error("API call error:", error);
    throw error;
  }
};

/**
 * Helper methods cho các HTTP methods phổ biến
 */
export const api = {
  get: (endpoint, options = {}) => {
    return apiCall(endpoint, { ...options, method: "GET" });
  },

  post: (endpoint, data, options = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  put: (endpoint, data, options = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (endpoint, options = {}) => {
    return apiCall(endpoint, { ...options, method: "DELETE" });
  },
};

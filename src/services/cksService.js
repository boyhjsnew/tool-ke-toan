import { getValidToken } from "./auth";

const API_BASE_URL = "https://admin.minvoice.com.vn/api";
const WINDOW_NO = "WIN00085";

/**
 * Tra cứu CKS theo mã số thuế
 * @param {string} msThue - Mã số thuế
 * @param {number} start - Vị trí bắt đầu (default: 0)
 * @param {number} count - Số lượng kết quả (default: 50)
 * @returns {Promise<Object>}
 */
export const traCuuCKS = async (msThue, start = 0, count = 50) => {
  try {
    // Tạo filter đơn giản với mã số thuế
    const filter = [
      {
        columnName: "ten_trangthai",
        columnType: "string",
        value: "",
        tableName: "vv_dmcks",
      },
      {
        columnName: "date_new",
        columnType: "datetime",
        value: { start: null, end: null },
        tableName: "vv_dmcks",
      },
      {
        columnName: "ms_thue",
        columnType: "string",
        value: msThue,
        tableName: "vv_dmcks",
      },
    ];

    // Encode filter vào query string
    const filterStr = encodeURIComponent(JSON.stringify(filter));
    const url = `${API_BASE_URL}/chukyso/getalldanhsach?windowno=${WINDOW_NO}&start=${start}&count=${count}&continue=true&filter=${filterStr}&infoparam=null&tlbparam=null`;

    // Lấy token
    const token = await getValidToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        WindowNo: WINDOW_NO,
        Authorization: `Bear ${token};VP`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Tra cứu CKS error:", error);
    throw error;
  }
};

/**
 * Tra cứu nhiều mã số thuế
 * @param {string[]} danhSachMST - Mảng mã số thuế
 * @returns {Promise<Array>} - Mảng kết quả
 */
export const traCuuNhieuCKS = async (danhSachMST) => {
  const results = [];

  for (const mst of danhSachMST) {
    try {
      const data = await traCuuCKS(mst);
      if (data.data && data.data.length > 0) {
        results.push(...data.data);
      } else {
        // Nếu không có kết quả, vẫn thêm record với MST
        results.push({
          ms_thue: mst,
          ngay_kichhoat: null,
          thanhtien: null,
        });
      }
    } catch (error) {
      console.error(`Lỗi tra cứu MST ${mst}:`, error);
      results.push({
        ms_thue: mst,
        ngay_kichhoat: null,
        thanhtien: null,
        error: error.message,
      });
    }
  }

  return results;
};

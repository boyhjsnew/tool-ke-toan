import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./TraCuuCKS.css";

const TraCuuCKS = () => {
  const [file, setFile] = useState(null);
  const [danhSachMST, setDanhSachMST] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Đọc file Excel
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError("");
    setResults([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Chuyển đổi sang JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Lấy cột đầu tiên (giả định cột A chứa mã số thuế)
        // Bỏ qua dòng đầu tiên (header) và filter các giá trị không hợp lệ
        const headerKeywords = ["mã số thuế", "mst", "ma so thue", "tax code"];
        const mstList = jsonData
          .slice(1) // Bỏ qua dòng đầu tiên (header)
          .map((row) => {
            // Lấy giá trị đầu tiên của mỗi dòng
            const value = row[0];
            // Chuyển đổi sang string và loại bỏ khoảng trắng
            return value ? String(value).trim() : null;
          })
          .filter((mst) => {
            // Loại bỏ giá trị rỗng và các giá trị là header
            if (!mst || mst.length === 0) return false;
            const lowerMst = mst.toLowerCase();
            return !headerKeywords.some((keyword) =>
              lowerMst.includes(keyword)
            );
          });

        if (mstList.length === 0) {
          setError(
            "Không tìm thấy mã số thuế trong file Excel. Vui lòng kiểm tra lại."
          );
          return;
        }

        setDanhSachMST(mstList);
      } catch (err) {
        setError("Lỗi đọc file Excel: " + err.message);
        console.error("Error reading Excel:", err);
      }
    };

    reader.onerror = () => {
      setError("Lỗi đọc file. Vui lòng thử lại.");
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // Tra cứu
  const handleTraCuu = async () => {
    if (danhSachMST.length === 0) {
      setError("Vui lòng upload file Excel chứa danh sách mã số thuế.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setProgress({ current: 0, total: danhSachMST.length });

    try {
      const ketQua = [];

      for (let i = 0; i < danhSachMST.length; i++) {
        const mst = danhSachMST[i];
        setProgress({ current: i + 1, total: danhSachMST.length });

        try {
          const { traCuuCKS } = await import("../services/cksService");
          const data = await traCuuCKS(mst);
          if (data.data && data.data.length > 0) {
            // Chỉ lấy những item có ten_trangthai = "Đã kích hoạt" hoặc có ngay_kichhoat
            const filteredData = data.data.filter((item) => {
              const hasTrangThai = item.ten_trangthai === "Đã kích hoạt";
              const hasNgayKichHoat = item.ngay_kichhoat !== null && item.ngay_kichhoat !== undefined;
              return hasTrangThai || hasNgayKichHoat;
            });
            
            if (filteredData.length > 0) {
              ketQua.push(...filteredData);
            }
            // Nếu không có item nào thỏa điều kiện, không thêm vào kết quả
          }
          // Nếu không có data, không thêm vào kết quả
        } catch (err) {
          console.error(`Lỗi tra cứu MST ${mst}:`, err);
          // Không thêm vào kết quả khi có lỗi
        }
      }

      setResults(ketQua);
    } catch (err) {
      setError("Lỗi tra cứu: " + err.message);
      console.error("Tra cứu error:", err);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Tải file mẫu
  const handleDownloadTemplate = () => {
    try {
      // Tạo dữ liệu mẫu
      const templateData = [
        ["Mã số thuế"], // Header
        ["0315827587"], // Ví dụ 1
        ["0100109106"], // Ví dụ 2
        ["0301234567"], // Ví dụ 3
      ];

      // Tạo workbook và worksheet
      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Đặt độ rộng cột
      ws["!cols"] = [{ wch: 15 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách MST");

      // Xuất file
      const fileName = "mau_import_ma_so_thue.xlsx";
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      setError("Lỗi tải file mẫu: " + err.message);
      console.error("Download template error:", err);
    }
  };

  // Export Excel kết quả
  const handleExportExcel = () => {
    if (results.length === 0) {
      setError("Không có dữ liệu để xuất Excel.");
      return;
    }

    try {
      // Filter bỏ các record có ms_thue là header hoặc không hợp lệ
      const headerKeywords = ["mã số thuế", "mst", "ma so thue", "tax code"];
      const validResults = results.filter((item) => {
        if (!item.ms_thue) return false;
        const lowerMst = String(item.ms_thue).toLowerCase().trim();
        return !headerKeywords.some((keyword) => lowerMst.includes(keyword));
      });

      // Chuẩn bị dữ liệu để export với format đúng
      const exportData = validResults.map((item) => {
        let ngayHieuLuc = "";
        if (item.ngay_kichhoat) {
          const date = new Date(item.ngay_kichhoat);
          // Format ngày theo Excel date (YYYY-MM-DD)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          ngayHieuLuc = `${year}-${month}-${day}`;
        }

        return {
          "NGÀY HIỆU LỰC": ngayHieuLuc,
          "Đại lý": item.ten_dvcs || "",
          "MST": item.ms_thue || "",
          "TÊN CTY": item.ten_kh || "",
          "GÓI": item.ten_goicuoc || "",
          "Tổng tiền": item.thanhtien ? Number(item.thanhtien) : null,
          "Ghi chú": item.ghi_chu || "",
        };
      });

      // Tạo workbook và worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Đặt độ rộng cột cho đẹp
      ws["!cols"] = [
        { wch: 18 }, // NGÀY HIỆU LỰC
        { wch: 25 }, // Đại lý
        { wch: 15 }, // MST
        { wch: 40 }, // TÊN CTY
        { wch: 50 }, // GÓI
        { wch: 15 }, // Tổng tiền
        { wch: 30 }, // Ghi chú
      ];

      // Freeze header row (dòng đầu tiên)
      ws["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activePane: "bottomLeft",
      };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kết quả tra cứu");

      // Xuất file
      const fileName = `ket_qua_tra_cuu_cks_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      setError("Lỗi xuất Excel: " + err.message);
      console.error("Export error:", err);
    }
  };

  return (
    <div className="tra-cuu-cks-container">
      <div className="tra-cuu-card">
        <h2 className="card-title">Tra cứu CKS</h2>

        <div className="upload-section">
          <div className="upload-controls">
            <label className="upload-label">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="file-input"
              />
              <div className="upload-button">
                {file ? `📄 ${file.name}` : "📁 Chọn file Excel"}
              </div>
            </label>
            <button
              onClick={handleDownloadTemplate}
              className="btn btn-outline"
              type="button"
            >
              📥 Tải file mẫu
            </button>
          </div>
          {danhSachMST.length > 0 && (
            <div className="mst-count">
              Đã đọc {danhSachMST.length} mã số thuế
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && progress.total > 0 && (
          <div className="progress-info">
            Đang tra cứu: {progress.current} / {progress.total} mã số thuế
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={handleTraCuu}
            disabled={loading || danhSachMST.length === 0}
            className="btn btn-primary"
          >
            {loading ? "⏳ Đang tra cứu..." : "🔍 Tra cứu"}
          </button>

          {results.length > 0 && (
            <button onClick={handleExportExcel} className="btn btn-success">
              📊 Xuất Excel
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="results-section">
            <h3 className="results-title">
              Kết quả tra cứu ({results.length} bản ghi)
            </h3>
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã số thuế</th>
                    <th>Ngày kích hoạt</th>
                    <th>Tổng tiền</th>
                    <th>Tên khách hàng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.ms_thue || "-"}</td>
                      <td>
                        {item.ngay_kichhoat
                          ? new Date(item.ngay_kichhoat).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </td>
                      <td>
                        {item.thanhtien
                          ? new Intl.NumberFormat("vi-VN").format(
                              item.thanhtien
                            )
                          : "-"}
                      </td>
                      <td>{item.ten_kh || "-"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            item.ten_trangthai ? "active" : "inactive"
                          }`}
                        >
                          {item.ten_trangthai || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraCuuCKS;


# ============================================================
# Slide data for appending to guide-transaction-blocks.html
# New slides: Full form Create Block + Full form Approve Block
# ============================================================

EXTRA_SLIDES_TRB = """
,{l:"[10] Form tạo phiếu (toàn bộ)",t:"Giao diện form tạo phiếu Xuất kho đầy đủ",d:"Toàn bộ các trường trong form tạo phiếu mới. Từ chọn loại, điền chứng từ đến nhập từng dòng hóa chất.",
ui:`<div style="background:#f1f5f9;padding:14px;min-height:360px">
<div style="max-width:760px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
<div style="background:linear-gradient(90deg,#dc2626,#f97316);padding:12px 16px;color:#fff;display:flex;align-items:center;justify-content:space-between">
<div><div style="font-size:10px;opacity:.8;font-weight:600;text-transform:uppercase">Phiếu giao dịch kho</div><div style="font-size:15px;font-weight:800">Tạo Phiếu Xuất Kho</div></div>
<button style="border:none;background:rgba(255,255,255,.2);color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer">&#10005; Hủy</button>
</div>
<div style="padding:14px">
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:8px">BƯỚC 1 — CHỌN LOẠI PHIẾU</div>
<div style="display:flex;gap:8px;margin-bottom:14px">
<div style="flex:1;border:2px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;cursor:pointer"><div style="font-size:20px">&#128229;</div><div style="font-weight:700;font-size:11px;margin-top:4px">Nhập kho</div><div style="font-size:9px;color:#64748b">IMPORT</div></div>
<div style="flex:1;border:2px solid #dc2626;border-radius:8px;padding:10px;text-align:center;background:#fef2f2"><div style="font-size:20px">&#128228;</div><div style="font-weight:700;font-size:11px;margin-top:4px;color:#dc2626">Xuất kho &#10003;</div><div style="font-size:9px;color:#dc2626">EXPORT</div></div>
<div style="flex:1;border:2px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;cursor:pointer"><div style="font-size:20px">&#128295;</div><div style="font-weight:700;font-size:11px;margin-top:4px">Điều chỉnh</div><div style="font-size:9px;color:#64748b">ADJUSTMENT</div></div>
</div>
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:8px">BƯỚC 2 — THÔNG TIN PHIẾU</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
<div style="display:flex;flex-direction:column;gap:3px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Số chứng từ tham chiếu</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px" value="REQ-LAB-2025-050" readonly></div>
<div style="display:flex;flex-direction:column;gap:3px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">COA / Hóa đơn cấp phiếu</label><select style="border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px"><option>&#128206; COA_HCl_LOT2024.pdf</option></select></div>
</div>
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:8px">BƯỚC 3 — DANH SÁCH HÓA CHẤT</div>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
<div style="display:flex;gap:2px;background:#f1f5f9;border-radius:6px;padding:2px"><div style="padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600;background:#fff;color:#dc2626;box-shadow:0 1px 3px rgba(0,0,0,.1)">Chi tiết</div><div style="padding:3px 10px;font-size:10px;font-weight:600;color:#64748b;cursor:pointer">Tổng hợp</div></div>
<div style="display:flex;gap:5px"><button style="border:1px solid #7c3aed;background:#fff;color:#7c3aed;border-radius:5px;padding:4px 9px;font-size:10px;font-weight:600;cursor:pointer">&#128247; Quét QR</button><button style="border:1px solid #e2e8f0;background:#fff;border-radius:5px;padding:4px 9px;font-size:10px;font-weight:600;cursor:pointer">+ Chọn từ kho</button></div>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:7px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
<div><span style="font-family:monospace;font-size:10px;color:#dc2626;font-weight:800">BTL-00123</span> <span style="font-weight:700;font-size:11px;margin-left:6px">Hydrochloric Acid 37%</span> <span style="display:inline-flex;padding:2px 6px;border-radius:999px;font-size:9px;font-weight:700;border:1px solid;background:#fff7ed;color:#c2410c;border-color:#fed7aa;margin-left:4px">C-Corrosive</span></div>
<div style="display:flex;gap:3px"><button style="border:1px solid #e2e8f0;border-radius:5px;padding:3px 8px;font-size:10px;background:#fff">&#128206; COA</button><button style="border:1px solid #e2e8f0;border-radius:5px;padding:3px 8px;font-size:10px;background:#fff">&#8853;</button><button style="border:1px solid #fee2e2;border-radius:5px;padding:3px 8px;font-size:10px;background:#fff;color:#dc2626">&#128465;</button></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px">
<div style="display:flex;flex-direction:column;gap:2px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Số lượng GD *</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:4px 7px;font-size:11px;font-weight:700" value="50" readonly></div>
<div style="display:flex;flex-direction:column;gap:2px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Đơn vị</label><select style="border:1px solid #e2e8f0;border-radius:5px;padding:4px 7px;font-size:11px"><option>mL</option></select></div>
<div style="display:flex;flex-direction:column;gap:2px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Khối lượng cả bì (g)</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:4px 7px;font-size:11px" value="120.5" readonly></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
<div style="display:flex;flex-direction:column;gap:2px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Analysis ID *</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:4px 7px;font-size:11px" value="ANL-2025-101" readonly></div>
<div style="display:flex;flex-direction:column;gap:2px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Ghi chú</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:4px 7px;font-size:11px" value="pH test" readonly></div>
</div>
</div>
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:8px;font-size:11px;color:#92400e;margin-bottom:10px">
&#9888;&#65039; EXPORT: số lượng nhập dương, hệ thống tự ghi âm vào ledger. VD: nhập 50 &#8594; lưu -50.
</div>
<div style="display:flex;justify-content:flex-end;gap:6px">
<button style="padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;border:1px solid #e2e8f0;background:#fff;cursor:pointer">Hủy</button>
<button style="padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;border:none;background:#dc2626;color:#fff;cursor:pointer">&#128190; Tạo phiếu &amp; Giao dịch</button>
</div>
</div></div></div>`,
hs:[["88px","86px","1",""],["88px","246px","2","blue"],["88px","404px","3","green"],["126px","50px","4","orange"],["126px","248px","5","purple"],["185px","50px","6",""],["219px","50px","7","orange"],["219px","235px","8","blue"]],
cs:[["","1","Card IMPORT","Click để chọn phiếu nhập kho. changeQty dương (+).","&#128070; Click card IMPORT"],
["blue","2","Card EXPORT (active)","Đang chọn. Viền đỏ = đang active. changeQty âm (-) khi duyệt.","&#9989; Đang chọn EXPORT"],
["green","3","Card ADJUSTMENT","Điều chỉnh tồn kho sau kiểm kê. changeQty nhập thủ công.","&#128070; Click card ADJUSTMENT"],
["orange","4","Số chứng từ","Mã PO hoặc mã yêu cầu để tra cứu sau.","&#9000;&#65039; Điền mã tham chiếu"],
["purple","5","COA cấp phiếu","Áp dụng cho TẤT CẢ chai khi duyệt. Khác với COA từng item.","&#128206; Chọn file COA/Invoice"],
["","6","Số lượng GD *","Luôn nhập số dương. Hệ thống tự xử lý dấu theo loại phiếu.","&#9000;&#65039; Điền số dương"],
["orange","7","Analysis ID *","Bắt buộc với EXPORT. Liên kết hóa chất với phép thử.","&#9000;&#65039; Điền mã ANL-xxx"],
["blue","8","Nút Tạo phiếu","Click để submit. Nút active khi có ít nhất 1 dòng hóa chất.","&#128070; Click sau khi điền đủ"]]},

{l:"[11] Form duyệt phiếu (toàn bộ)",t:"Modal Duyệt Phiếu — Approval Workflow",d:"Toàn bộ giao diện duyệt phiếu. Gồm 2 tab: Chi tiết (xem lại các dòng) và Picking List (chọn chai thực tế bốc).",
ui:`<div style="background:#f1f5f9;padding:14px">
<div style="max-width:720px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
<div style="background:linear-gradient(90deg,#059669,#10b981);padding:12px 16px;color:#fff;display:flex;align-items:center;justify-content:space-between">
<div><div style="font-size:10px;opacity:.8;font-weight:600;text-transform:uppercase">Approval Workflow</div><div style="font-size:15px;font-weight:800">Duyệt Phiếu TRB-2025-002 (EXPORT)</div></div>
<button style="border:none;background:rgba(255,255,255,.2);color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer">&#10005;</button>
</div>
<div style="padding:14px">
<div style="display:flex;gap:3px;background:#f1f5f9;border-radius:7px;padding:3px;width:fit-content;margin-bottom:14px">
<div style="padding:5px 14px;border-radius:5px;font-size:11px;font-weight:600;background:#fff;color:#059669;box-shadow:0 1px 4px rgba(0,0,0,.1)">Chi tiết Line Items</div>
<div style="padding:5px 14px;font-size:11px;font-weight:600;color:#64748b;cursor:pointer">Picking List (FEFO)</div>
</div>
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:7px">DANH SÁCH DÒNG GIAO DỊCH DỰ KIẾN</div>
<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px">
<thead><tr style="background:#f8fafc">
<th style="padding:6px 10px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">Chai được phân bổ</th>
<th style="padding:6px 10px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">Hóa chất</th>
<th style="padding:6px 10px;border-bottom:2px solid #e2e8f0;text-align:right;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">SL thay đổi</th>
<th style="padding:6px 10px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">Đv</th>
<th style="padding:6px 10px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">Analysis ID</th>
<th style="padding:6px 10px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">Hạn SD</th>
</tr></thead>
<tbody>
<tr style="border-bottom:1px solid #f8fafc">
<td style="padding:7px 10px"><span style="font-family:monospace;font-size:10px;color:#2563eb;font-weight:700">BTL-00123</span></td>
<td style="padding:7px 10px;font-weight:600">Hydrochloric Acid 37%</td>
<td style="padding:7px 10px;text-align:right;font-weight:800;color:#dc2626">-50</td>
<td style="padding:7px 10px;color:#94a3b8">mL</td>
<td style="padding:7px 10px;color:#7c3aed;font-size:10px;font-family:monospace">ANL-2025-101</td>
<td style="padding:7px 10px;color:#64748b;font-size:10px">31/12/2025</td>
</tr>
<tr style="border-bottom:1px solid #f8fafc">
<td style="padding:7px 10px"><span style="font-family:monospace;font-size:10px;color:#2563eb;font-weight:700">BTL-00201</span></td>
<td style="padding:7px 10px;font-weight:600">Acetone HPLC Grade</td>
<td style="padding:7px 10px;text-align:right;font-weight:800;color:#dc2626">-30</td>
<td style="padding:7px 10px;color:#94a3b8">mL</td>
<td style="padding:7px 10px;color:#7c3aed;font-size:10px;font-family:monospace">ANL-2025-101</td>
<td style="padding:7px 10px;color:#64748b;font-size:10px">30/06/2025</td>
</tr>
</tbody></table>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
<span style="font-size:18px">&#9989;</span>
<div style="font-size:11px;color:#15803d"><b>Phân bổ FEFO hợp lệ:</b> Tất cả chai được chọn đúng theo nguyên tắc hết hạn trước xuất trước. Tổng xuất không vượt tồn kho.</div>
</div>
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#92400e">
&#9888;&#65039; <b>Cảnh báo:</b> Sau khi nhấn Xác nhận Duyệt, tồn kho sẽ bị thay đổi trực tiếp. Hành động này <b>không thể hoàn tác</b>. Nếu sai, hãy tạo phiếu ADJUSTMENT để bù trừ.
</div>
<div style="display:flex;justify-content:flex-end;gap:6px">
<button style="padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;border:1px solid #e2e8f0;background:#fff;cursor:pointer">Hủy</button>
<button style="padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;border:1px solid #d97706;background:#fff;color:#d97706;cursor:pointer">&#8635; Tính lại phân bổ</button>
<button style="padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;border:1px solid #2563eb;background:#fff;color:#2563eb;cursor:pointer">&#128190; Lưu phân bổ</button>
<button style="padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;border:none;background:#059669;color:#fff;cursor:pointer">&#10003; Xác nhận Duyệt</button>
</div>
</div></div></div>`,
hs:[["73px","105px","1","blue"],["73px","246px","2","purple"],["126px","50px","3",""],["155px","50px","4",""],["225px","318px","5","orange"],["225px","420px","6","blue"],["225px","535px","7","green"]],
cs:[["blue","1","Tab Chi tiết Line Items","Xem lại toàn bộ dòng hóa chất trước khi duyệt. Kiểm tra số lượng và Analysis ID.","&#128270; Kiểm tra trước khi duyệt"],
["purple","2","Tab Picking List (FEFO)","Hệ thống đề xuất chai theo FEFO. Người duyệt có thể đổi sang chai khác nếu cần.","&#128070; Click để xem/đổi chai"],
["","3","SL thay đổi (đỏ = âm)","Số âm = kho bị trừ. Kiểm tra kỹ số lượng khớp với yêu cầu.","&#128270; Kiểm tra số lượng"],
["","4","Banner FEFO hợp lệ","Màu xanh = phân bổ hợp lệ. Màu đỏ = có vấn đề (vượt tồn, hết hạn sai...).","&#9989; Phải xanh mới duyệt"],
["orange","5","Tính lại phân bổ","Sau khi đổi chai trong Picking List, click để recalculate.","&#128070; Click để recalculate"],
["blue","6","Lưu phân bổ","Lưu tạm cấu hình chai mà chưa duyệt.","&#128070; Click để lưu tạm"],
["green","7","Xác nhận Duyệt","FINAL ACTION — không thể hoàn tác. Tồn kho thay đổi ngay.","&#9888;&#65039; Click để duyệt chính thức"]]}
"""

# ============================================================
# Slide data for appending to guide-transactions.html
# New slides: Full table UI + Full export report form
# ============================================================

EXTRA_SLIDES_TXN = """
,{l:"[7] Bảng GD đầy đủ",t:"Giao diện bảng Lịch sử Giao dịch — toàn bộ cột",d:"Bảng ledger chính thức với tất cả 14 cột dữ liệu. Mỗi dòng = 1 giao dịch đã được ghi sau khi phiếu APPROVED.",
ui:`<div style="background:#f1f5f9;padding:14px;min-height:340px">
<div style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
<div style="background:linear-gradient(90deg,#7c3aed,#a78bfa);padding:10px 16px;color:#fff;display:flex;align-items:center;justify-content:space-between">
<div><div style="font-size:10px;opacity:.8;font-weight:600;text-transform:uppercase">Transaction Ledger</div><div style="font-size:14px;font-weight:800">Lịch sử Giao dịch Hóa chất</div></div>
<button style="border:none;background:rgba(255,255,255,.2);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">&#128229; Xuất báo cáo</button>
</div>
<div style="padding:10px 14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;gap:8px">
<div style="display:flex;gap:5px;align-items:center">
<div style="display:flex;align-items:center;gap:5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 10px;min-width:240px;font-size:11px;color:#94a3b8">&#128269; Tìm mã GD, hóa chất, CAS, ANL...</div>
<button style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid #e2e8f0;background:#fff;cursor:pointer">Tìm kiếm</button>
<button style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid #e2e8f0;background:#fff;cursor:pointer">&#8635;</button>
</div>
<div style="display:flex;gap:5px">
<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #7c3aed;border-radius:5px;font-size:10px;color:#7c3aed;background:#f5f3ff">&#128200; EXPORT &#10005;</span>
<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #7c3aed;border-radius:5px;font-size:10px;color:#7c3aed;background:#f5f3ff">Tháng 4 &#10005;</span>
</div>
</div>
<div style="overflow-x:auto">
<table style="width:100%;border-collapse:collapse;font-size:10px">
<thead><tr style="background:#f8fafc">
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">Mã GD</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">Mã Phiếu</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap;display:flex;gap:3px;align-items:center">Ngày <span style="background:#ede9fe;color:#7c3aed;border-radius:3px;padding:1px 4px">&#9660;</span></th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase">Hành động</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">Mã SKU</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">Mã cũ</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">Tên hóa chất</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase">CAS</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">Mã lọ</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase">Lô</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:right;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">SL</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase">Đv</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:right;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;white-space:nowrap">KL cả bì</th>
<th style="padding:6px 9px;border-bottom:2px solid #e2e8f0;text-align:left;font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase">Ghi chú</th>
</tr></thead>
<tbody>
<tr style="background:#faf5ff;cursor:pointer">
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#7c3aed;font-weight:700">TXN-00501</td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#94a3b8">TRB-001</td>
<td style="padding:6px 9px;color:#64748b;font-size:9px">15/04</td>
<td style="padding:6px 9px"><span style="display:inline-flex;padding:2px 6px;border-radius:999px;font-size:8px;font-weight:700;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca">EXPORT</span></td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#64748b">SKU-0001</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px">HC-001</td>
<td style="padding:6px 9px;font-weight:700;font-size:10px">Hydrochloric Acid</td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#94a3b8">7647-01-0</td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#2563eb;font-weight:700">BTL-00123</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px">LOT-24-05</td>
<td style="padding:6px 9px;text-align:right;font-weight:800;font-size:11px;color:#dc2626">-50</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px">mL</td>
<td style="padding:6px 9px;text-align:right;color:#94a3b8;font-size:9px">120.5</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px;font-style:italic">pH test</td>
</tr>
<tr style="cursor:pointer">
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#7c3aed;font-weight:700">TXN-00480</td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#94a3b8">TRB-002</td>
<td style="padding:6px 9px;color:#64748b;font-size:9px">10/04</td>
<td style="padding:6px 9px"><span style="display:inline-flex;padding:2px 6px;border-radius:999px;font-size:8px;font-weight:700;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0">IMPORT</span></td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#64748b">SKU-0001</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px">HC-001</td>
<td style="padding:6px 9px;font-weight:700;font-size:10px">Hydrochloric Acid</td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#94a3b8">7647-01-0</td>
<td style="padding:6px 9px;font-family:monospace;font-size:9px;color:#2563eb;font-weight:700">BTL-00124</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px">LOT-24-05</td>
<td style="padding:6px 9px;text-align:right;font-weight:800;font-size:11px;color:#059669">+700</td>
<td style="padding:6px 9px;color:#94a3b8;font-size:9px">mL</td>
<td style="padding:6px 9px;text-align:right;color:#94a3b8;font-size:9px">870.0</td>
<td style="padding:6px 9px;color:#94a3b8;font-style:italic;font-size:9px">—</td>
</tr>
</tbody></table></div>
<div style="padding:6px 14px;background:#fafafa;border-top:1px solid #f1f5f9;display:flex;align-items:center;gap:3px">
<button style="width:22px;height:22px;border-radius:4px;border:1px solid #e2e8f0;background:#7c3aed;color:#fff;font-size:10px;cursor:pointer;font-weight:700">1</button>
<button style="width:22px;height:22px;border-radius:4px;border:1px solid #e2e8f0;background:#fff;font-size:10px;cursor:pointer;font-weight:700">2</button>
<button style="width:22px;height:22px;border-radius:4px;border:1px solid #e2e8f0;background:#fff;font-size:10px;cursor:pointer">&#8230;</button>
<button style="width:22px;height:22px;border-radius:4px;border:1px solid #e2e8f0;background:#fff;font-size:10px;cursor:pointer;font-weight:700">12</button>
<span style="margin-left:auto;font-size:10px;color:#94a3b8">1–20 / 234 mục &nbsp; Hiển thị: <select style="font-size:10px;border:1px solid #e2e8f0;border-radius:4px;padding:1px 4px"><option>20</option><option>50</option><option>100</option></select></span>
</div>
</div></div>`,
hs:[["47px","670px","1","purple"],["28px","260px","2",""],["105px","350px","3",""],["105px","440px","4",""]],
cs:[["purple","1","Nút Xuất báo cáo","Xuất toàn bộ data đang filter ra PDF/Excel. Active chỉ khi có dữ liệu.","&#128070; Click để xuất báo cáo"],
["","2","Chip filter đang active","Mỗi chip = 1 bộ lọc đang áp dụng. Click &#10005; trên chip để xóa bộ lọc đó.","&#128070; Click &#10005; để xóa filter"],
["","3","Hàng click-able","Click vào hàng để mở panel chi tiết. Hàng first = nền tím nhạt (đang chọn).","&#128070; Click hàng để xem chi tiết"],
["","4","Cột SL âm/dương","Đỏ (-) = xuất/giảm kho. Xanh (+) = nhập/tăng kho. ADJUSTMENT có thể âm hoặc dương.","&#128308; Đỏ = giảm · &#128994; Xanh = tăng"]]},

{l:"[8] Form Xuất báo cáo",t:"Form Xuất Báo cáo Giao dịch đầy đủ",d:"Toàn bộ giao diện form xuất báo cáo. Chọn khoảng ngày, điền tiêu đề, chọn loại giao dịch, xuất PDF.",
ui:`<div style="background:#f1f5f9;padding:14px;min-height:340px">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
<div style="background:linear-gradient(90deg,#7c3aed,#a78bfa);padding:12px 16px;color:#fff">
<div style="font-size:10px;opacity:.8;font-weight:600;text-transform:uppercase">Report Generator</div>
<div style="font-size:15px;font-weight:800">Xuất Báo cáo Giao dịch Hóa chất</div>
</div>
<div style="padding:16px">
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:8px">THÔNG TIN KHOẢNG THỜI GIAN</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
<div style="display:flex;flex-direction:column;gap:3px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Từ ngày *</label><input style="border:1px solid #7c3aed;border-radius:5px;padding:5px 8px;font-size:11px;outline:none" value="01/04/2025" readonly></div>
<div style="display:flex;flex-direction:column;gap:3px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Đến ngày *</label><input style="border:1px solid #7c3aed;border-radius:5px;padding:5px 8px;font-size:11px;outline:none" value="17/04/2025" readonly></div>
</div>
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:8px">THÔNG TIN BÁO CÁO</div>
<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Tiêu đề báo cáo *</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px" value="Báo cáo xuất hóa chất tháng 4/2025" readonly></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
<div style="display:flex;flex-direction:column;gap:3px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Người lập báo cáo</label><input style="border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px" value="Nguyễn Văn A" readonly></div>
<div style="display:flex;flex-direction:column;gap:3px"><label style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Lọc loại giao dịch</label><select style="border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px"><option>Tất cả (IMPORT + EXPORT + ADJUSTMENT)</option><option>Chỉ EXPORT</option><option>Chỉ IMPORT</option></select></div>
</div>
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.08em;margin-bottom:8px">THỐNG KÊ DỮ LIỆU SẼ XUẤT</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
<div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:8px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#7c3aed">12</div><div style="font-size:9px;color:#64748b;margin-top:2px">Giao dịch EXPORT</div></div>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#059669">3</div><div style="font-size:9px;color:#64748b;margin-top:2px">Giao dịch IMPORT</div></div>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#2563eb">234</div><div style="font-size:9px;color:#64748b;margin-top:2px">Tổng giao dịch</div></div>
</div>
<div style="display:flex;justify-content:flex-end;gap:6px">
<button style="padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;border:1px solid #e2e8f0;background:#fff;cursor:pointer">Hủy</button>
<button style="padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;border:1px solid #7c3aed;background:#fff;color:#7c3aed;cursor:pointer">&#128190; Xem trước</button>
<button style="padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;border:none;background:#7c3aed;color:#fff;cursor:pointer">&#128229; Xuất PDF</button>
</div>
</div>
</div></div>`,
hs:[["73px","58px","1","blue"],["73px","370px","2","blue"],["100px","58px","3",""],["100px","370px","4","orange"],["186px","50px","5",""],["186px","237px","6",""],["186px","370px","7",""],["235px","413px","8","purple"],["235px","520px","9","green"]],
cs:[["blue","1","Từ ngày (bắt buộc)","Điền ngày bắt đầu khoảng báo cáo. Border tím = đang focus.","&#9000;&#65039; Điền ngày bắt đầu"],
["blue","2","Đến ngày (bắt buộc)","Điền ngày kết thúc. Sẽ lấy đến hết ngày đó (23:59:59).","&#9000;&#65039; Điền ngày kết thúc"],
["","3","Tiêu đề báo cáo","In trên đầu file PDF. Điền rõ ràng để dễ lưu trữ.","&#9000;&#65039; Điền tiêu đề báo cáo"],
["orange","4","Lọc loại GD","Chọn chỉ EXPORT hoặc chỉ IMPORT nếu cần báo cáo riêng.","&#128070; Chọn loại giao dịch"],
["","5","Tổng EXPORT","Preview số lượng giao dịch sẽ xuất ra.","&#128200; Xem trước số dòng"],
["","6","Tổng IMPORT","Kiểm tra đúng khoảng ngày trước khi xuất.","&#128200; Xem trước số dòng"],
["","7","Tổng tất cả","Tổng tất cả loại trong khoảng ngày.","&#128200; Xem trước số dòng"],
["purple","8","Nút Xem trước","Mở preview báo cáo trong browser trước khi xuất PDF chính thức.","&#128070; Click để xem trước"],
["green","9","Nút Xuất PDF","Tạo file PDF và download về máy. Tên file tự động theo tiêu đề báo cáo.","&#128070; Click để xuất PDF"]]}
"""

import re

# === Update guide-transaction-blocks.html ===
trb_path = r"c:\Users\quang\Desktop\desktop\Back\NEW UI\lims\src\components\inventory\guild\guide-transaction-blocks.html"
with open(trb_path, "r", encoding="utf-8") as f:
    trb_content = f.read()

# Find "var S=[" ... "];" and append new slides before "];"
# Find last "}];" pattern
old_end = "}];"
new_end = "}" + EXTRA_SLIDES_TRB + "];"
trb_content_new = trb_content.replace(old_end, new_end, 1)

# Update slide count in top bar (was "Slide 1 / 9" -> "Slide 1 / 11")
trb_content_new = trb_content_new.replace("Slide 1 / 9", "Slide 1 / 11", 1)

with open(trb_path, "w", encoding="utf-8") as f:
    f.write(trb_content_new)
print("guide-transaction-blocks.html updated: +2 slides (total 11)")

# === Update guide-transactions.html ===
txn_path = r"c:\Users\quang\Desktop\desktop\Back\NEW UI\lims\src\components\inventory\guild\guide-transactions.html"
with open(txn_path, "r", encoding="utf-8") as f:
    txn_content = f.read()

old_end2 = "}];"
new_end2 = "}" + EXTRA_SLIDES_TXN + "];"
txn_content_new = txn_content.replace(old_end2, new_end2, 1)

# Update slide count
txn_content_new = txn_content_new.replace("Slide 1 / 6", "Slide 1 / 8", 1)

with open(txn_path, "w", encoding="utf-8") as f:
    f.write(txn_content_new)
print("guide-transactions.html updated: +2 slides (total 8)")

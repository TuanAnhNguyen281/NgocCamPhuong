import { useMemo, useState } from "react";
import type { UserRole } from "../../api";
import { useAdmin } from "../../admin-context";
import { useApp } from "../../app-context";
import { FeedbackBanner } from "../../components/FeedbackBanner";

const roleLabel: Record<UserRole, string> = { customer: "Khách hàng", manager: "Quản lý", admin: "Quản trị viên" };

export function UsersAdminPage() {
  const { auth } = useApp();
  const { users, loading, updateRole } = useAdmin();
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);
  const filtered = useMemo(() => { const keyword = search.trim().toLocaleLowerCase(); return users.filter((item) => !keyword || `${item.full_name} ${item.email} ${item.role}`.toLocaleLowerCase().includes(keyword)); }, [search, users]);
  if (auth?.user.role !== "admin") return <div className="admin-card permission-card"><span className="admin-kicker">QUYỀN TRUY CẬP</span><h2>Màn hình dành cho quản trị viên.</h2><p>Tài khoản quản lý cửa hàng không được thay đổi vai trò người dùng.</p></div>;
  async function changeRole(id: number, role: UserRole) { setUpdating(id); try { await updateRole(id, role); } finally { setUpdating(null); } }
  return <><FeedbackBanner /><section className="admin-toolbar"><div className="admin-search"><span>Tìm người dùng</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, email hoặc vai trò..." /></div></section><section className="admin-card table-card"><header className="table-card-head"><div><span className="admin-kicker">TÀI KHOẢN & PHÂN QUYỀN</span><h2>{filtered.length} người dùng</h2></div><span>Thay đổi vai trò có hiệu lực ở lần xác thực tiếp theo</span></header>{loading ? <div className="admin-loading">Đang tải người dùng...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Người dùng</th><th>Ngày tạo</th><th>Lần đăng nhập cuối</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><div className="user-cell"><span>{user.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{user.full_name}</strong><small>{user.email}</small></div></div></td><td>{new Date(user.created_at).toLocaleDateString("vi-VN")}</td><td>{user.last_login_at ? new Date(user.last_login_at).toLocaleString("vi-VN") : "Chưa đăng nhập"}</td><td><select disabled={updating === user.id || user.id === auth.user.id} value={user.role} onChange={(event) => void changeRole(user.id, event.target.value as UserRole)}>{(Object.keys(roleLabel) as UserRole[]).map((role) => <option key={role} value={role}>{roleLabel[role]}</option>)}</select></td><td><span className={`status-pill ${user.status}`}>{user.status === "active" ? "Đang hoạt động" : "Đã khóa"}</span></td></tr>)}</tbody></table></div>}</section></>;
}

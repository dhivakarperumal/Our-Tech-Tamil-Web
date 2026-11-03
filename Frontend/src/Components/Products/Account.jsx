import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Search,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  ShoppingBag,
  User,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import PageContainer from "../CommenComponents/PageContainer";

/* ─── helpers ─────────────────────────────────────────────────────── */
function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

/* ─── Avatar ───────────────────────────────────────────────────────── */
function Avatar({ name, size = "lg" }) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gradient-middle font-extrabold text-white ${dim}`}
    >
      {getInitials(name) || <UserRound size={size === "lg" ? 28 : 18} />}
    </span>
  );
}

/* ─── Section tabs ─────────────────────────────────────────────────── */
const TABS = [
  { id: "personal", label: "Personal Details", Icon: User },
  { id: "orders",   label: "My Orders",        Icon: Package },
  { id: "address",  label: "My Addresses",     Icon: MapPin },
  { id: "password", label: "Change Password",  Icon: Lock },
];

/* ─── Input ────────────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#e2d3f5] bg-white px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      {Icon && <Icon size={16} className="shrink-0 text-primary/60" />}
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        {...props}
      />
    </div>
  );
}

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#e2d3f5] bg-white px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      {Icon && <Icon size={16} className="shrink-0 text-primary/60" />}
      <select
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

/* ─── Personal Details panel ───────────────────────────────────────── */
function PersonalDetails({ user, setUser }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({
    username: user?.username || "",
    email:    user?.email    || "",
    phone:    user?.phone    || "",
    dob:      user?.dob      || "",
    gender:   user?.gender   || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCancel = () =>
    setForm({
      username: user?.username || "",
      email:    user?.email    || "",
      phone:    user?.phone    || "",
      dob:      user?.dob      || "",
      gender:   user?.gender   || "",
    });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return toast.error("Full name is required.");
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", {
        username: form.username,
        phone:    form.phone,
        dob:      form.dob,
        gender:   form.gender,
      });
      const updated = { ...user, ...data.user };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      login(updated, localStorage.getItem("token"));
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User size={20} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-[#1a0745]">Personal Details</h2>
          <p className="text-xs text-gray-500">View and update your personal information.</p>
        </div>
      </div>

      {/* Avatar row */}
      <div className="mt-6 flex items-center gap-4">
        <div className="relative">
          <Avatar name={user?.username} size="lg" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow">
            <Camera size={12} />
          </span>
        </div>
        <div>
          <p className="font-bold text-[#1a0745]">{user?.username}</p>
          <p className="text-xs text-gray-400">JPG, PNG (Max 2MB)</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input icon={User} name="username" value={form.username} onChange={handleChange} placeholder="Your full name" />
          </Field>
          <Field label="Date of Birth">
            <Input icon={CalendarDays} name="dob" type="date" value={form.dob} onChange={handleChange} />
          </Field>
          <Field label="Email Address" required>
            <Input icon={Mail} name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" disabled />
          </Field>
          <Field label="Gender">
            <Select icon={User} name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Phone Number">
            <Input icon={Phone} name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 00000 00000" />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-xl border border-[#d4c5f0] px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-[#faf7ff]"
          >
            <X size={15} /> Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Change Password panel ────────────────────────────────────────── */
function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) return toast.error("Current password is required.");
    if (form.newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return toast.error("Passwords do not match.");
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(data.message || "Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound size={20} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-[#1a0745]">Change Password</h2>
          <p className="text-xs text-gray-500">Update your account password.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 max-w-md space-y-5">
        <Field label="Current Password" required>
          <Input icon={Lock} name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} placeholder="Enter current password" />
        </Field>
        <Field label="New Password" required>
          <Input icon={Lock} name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="Min. 8 characters" />
        </Field>
        <Field label="Confirm New Password" required>
          <Input icon={Lock} name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
            className="flex items-center gap-2 rounded-xl border border-[#d4c5f0] px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-[#faf7ff]"
          >
            <X size={15} /> Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            <Save size={15} /> {saving ? "Saving…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* --- My Orders (full) -------------------------------------------- */
const ORDER_STEPS = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];

function statusBadge(status) {
  if (status === "Delivered")        return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Cancelled")        return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "Out for Delivery") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (status === "Shipping" || status === "Shipped") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
}

function formatDate(v) {
  if (!v) return "�";
  const d = new Date(v);
  return isNaN(d) ? "�" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function MyOrders({ user }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);
  const [search,  setSearch]  = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user?.user_id) { setLoading(false); return; }
    let active = true;
    api.get("/orders")
      .then(({ data }) => {
        if (active) {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => { if (active) { setFailed(true); setLoading(false); } });
    return () => { active = false; };
  }, [user?.user_id]);

  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [o.order_id, o.id, o.status, o.tracking_number, o.courier_name]
      .some((v) => String(v || "").toLowerCase().includes(q));
  });

  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#f0e8ff] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package size={20} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#1a0745]">My Orders</h2>
            <p className="text-xs text-gray-500">
              {loading ? "Loading�" : " order"}
            </p>
          </div>
        </div>
        <Link
          to="/ordersmain"
          className="hidden items-center gap-1.5 rounded-xl border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/5 sm:flex"
        >
          <Package size={13} /> Track Orders
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[#f3eaff]/50" />
          ))}
        </div>
      ) : failed ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Could not load your orders. Please refresh and try again.
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 py-8 text-center">
          <Package size={52} className="text-primary/20" strokeWidth={1.2} />
          <p className="font-semibold text-gray-500">No orders yet</p>
          <p className="text-xs text-gray-400">Your orders will appear here after checkout.</p>
          <Link to="/shop" className="mt-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle px-5 py-2 text-sm font-bold text-white shadow transition hover:brightness-110">
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          {/* search */}
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or status�"
              className="w-full rounded-xl border border-[#e2d3f5] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="mt-4 text-center text-sm text-gray-400">No matching orders found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((order) => {
                const status = order.status || "Order Placed";
                const step = status === "Processing" || status === "New" ? 0
                  : status === "Shipped" ? 2
                  : Math.max(0, ORDER_STEPS.indexOf(status));
                const isOpen = expanded === order.id;
                return (
                  <div key={order.id} className="overflow-hidden rounded-2xl border border-[#e9def5] bg-[#faf8ff] shadow-sm">
                    {/* row header */}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Order ID</p>
                        <p className="mt-0.5 font-extrabold text-[#1a0745]">#{order.order_id || order.id}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={"rounded-full border px-3 py-1 text-[11px] font-bold "}>
                          {status}
                        </span>
                        <strong className="text-sm text-[#1a0745]">
                          ?{Number(order.total_amount || 0).toLocaleString("en-IN")}
                        </strong>
                        <ChevronRight
                          size={16}
                          className={"text-gray-400 transition-transform "}
                        />
                      </div>
                    </button>

                    {/* expanded detail */}
                    {isOpen && (
                      <div className="border-t border-[#e9def5] px-5 pb-5 pt-4">
                        {/* progress bar */}
                        {status !== "Cancelled" && (
                          <div className="mb-5">
                            <ol className="flex items-start justify-between gap-1">
                              {ORDER_STEPS.map((s, i) => {
                                const done = step >= i;
                                return (
                                  <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
                                    <span className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition "}>
                                      {done ? "?" : i + 1}
                                    </span>
                                    <span className={"text-[10px] leading-tight font-semibold "}>
                                      {s}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        )}

                        {status === "Cancelled" && (
                          <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
                            {order.cancellation_reason || "This order was cancelled."}
                          </p>
                        )}

                        {/* items */}
                        {order.items?.length > 0 && (
                          <div className="mb-4 space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Items</p>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 rounded-xl bg-white p-3 border border-[#ede5f8]">
                                {item.image ? (
                                  <img src={item.image.startsWith("http") ? item.image : ""} alt={item.product_name} className="h-12 w-12 rounded-lg object-contain border border-[#e2d3f5]" />
                                ) : (
                                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package size={20} /></span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-[#1a0745]">{item.product_name}</p>
                                  <p className="text-xs text-gray-400">
                                    Qty: {item.quantity}
                                    {item.variant_color &&  � }
                                    {item.variant_size  &&  � }
                                  </p>
                                </div>
                                <p className="shrink-0 text-sm font-bold text-primary">?{Number(item.total || 0).toLocaleString("en-IN")}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* tracking */}
                        {(order.tracking_number || order.courier_name) && (
                          <div className="mt-2 rounded-xl bg-white border border-[#ede5f8] p-3 text-xs text-gray-600">
                            {order.tracking_number && <p>Tracking: <strong className="text-[#1a0745]">{order.tracking_number}</strong></p>}
                            {order.courier_name    && <p>Courier: <strong className="text-[#1a0745]">{order.courier_name}</strong></p>}
                          </div>
                        )}

                        {/* footer */}
                        <div className="mt-3 flex items-center justify-between border-t border-[#e9def5] pt-3">
                          <span className="text-xs text-gray-400">
                            Payment: <strong className="text-gray-600">{order.payment_method || "�"}</strong>
                            <span className="ml-2">�</span>
                            <strong className={"ml-2 "}>
                              {order.payment_status || "Pending"}
                            </strong>
                          </span>
                          <strong className="text-sm text-primary">Total: ?{Number(order.total_amount || 0).toLocaleString("en-IN")}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── My Addresses placeholder ─────────────────────────────────────── */
function MyAddresses() {
  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin size={20} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-[#1a0745]">My Addresses</h2>
          <p className="text-xs text-gray-500">Manage your saved delivery addresses.</p>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-4 py-8 text-center">
        <MapPin size={52} className="text-primary/20" strokeWidth={1.2} />
        <p className="font-semibold text-gray-500">No saved addresses yet.</p>
        <p className="text-xs text-gray-400">Addresses you use at checkout will be saved here.</p>
      </div>
    </div>
  );
}

/* ─── Main Account page ────────────────────────────────────────────── */
function Account() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-[#e9def5] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound size={32} />
          </span>
          <h2 className="mt-5 text-xl font-extrabold text-[#1a0745]">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-500">Access your profile, orders and more.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2d0060] via-primary to-[#7200d6] py-10">
        <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <PageContainer>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight size={13} />
            <span className="text-white/90">My Account</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">My Account</h1>
          <p className="mt-1 text-sm text-white/70">Manage your profile, orders, addresses and security.</p>
        </PageContainer>
        {/* decorative gadgets */}
        <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 hidden gap-4 opacity-20 lg:flex">
          <span className="text-6xl">🎧</span>
          <span className="text-7xl">💻</span>
          <span className="text-5xl">🛍️</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="bg-[#faf9fc] py-8 sm:py-12">
        <PageContainer>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* ── Sidebar ── */}
            <aside className="w-full shrink-0 lg:w-64">
              <div className="rounded-2xl border border-[#e9def5] bg-white p-5 shadow-sm">
                {/* User info */}
                <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-4">
                  <Avatar name={user.username} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[#1a0745]">{user.username || "User"}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Nav */}
                <nav className="mt-4 space-y-1">
                  {TABS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        activeTab === id
                          ? "border-l-4 border-primary bg-[#f3eaff] text-primary"
                          : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}

                  {/* Shop link */}
                  <Link
                    to="/shop"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-[#faf7ff] hover:text-primary"
                  >
                    <ShoppingBag size={18} />
                    Browse Shop
                  </Link>

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </nav>
              </div>
            </aside>

            {/* ── Main Panel ── */}
            <div className="min-w-0 flex-1">
              {activeTab === "personal"  && <PersonalDetails user={user} setUser={setUser} />}
              {activeTab === "orders"    && <MyOrders user={user} />}
              {activeTab === "address"   && <MyAddresses />}
              {activeTab === "password"  && <ChangePassword />}
            </div>

          </div>
        </PageContainer>
      </div>

      {/* ── Logout confirm modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <LogOut size={26} />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-gray-800">Confirm Logout</h2>
            <p className="mt-2 text-sm text-gray-500">Are you sure you want to sign out?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Account;
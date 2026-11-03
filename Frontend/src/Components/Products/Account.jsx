import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  ChevronRight,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Eye,
  EyeOff,
  Save,
  Search,
  ShoppingBag,
  User,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

function getInitials(name) {
  if (!name) return "";
  return name.trim().split(/\s+/).map(function(w){ return w[0] ? w[0].toUpperCase() : ""; }).slice(0,2).join("");
}

function formatDate(v) {
  if (!v) return "-";
  var d = new Date(v);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadgeClass(status) {
  if (status === "Delivered")        return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Cancelled")        return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "Out for Delivery") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (status === "Shipping" || status === "Shipped") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
}

const ORDER_STEPS = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];

function Avatar({ name, size }) {
  var sz = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  return (
    <span className={"inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gradient-middle font-extrabold text-white " + sz}>
      {getInitials(name) || <UserRound size={size === "lg" ? 28 : 18} />}
    </span>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputBox({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#e2d3f5] bg-white px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      {Icon && <Icon size={16} className="shrink-0 text-primary/60" />}
      <input className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60" {...props} />
    </div>
  );
}

function SelectBox({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#e2d3f5] bg-white px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      {Icon && <Icon size={16} className="shrink-0 text-primary/60" />}
      <select className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none" {...props}>{children}</select>
    </div>
  );
}

function PersonalDetails({ user, setUser }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: user?.username || "", email: user?.email || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);
  const change = function(e) { setForm(function(p){ return { ...p, [e.target.name]: e.target.value }; }); };
  const cancel = function() { setForm({ username: user?.username || "", email: user?.email || "", phone: user?.phone || "" }); };
  const save = async function(e) {
    e.preventDefault();
    if (!form.username.trim()) return toast.error("Full name is required.");
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", { username: form.username, phone: form.phone });
      const updated = { ...user, ...data.user };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      login(updated, localStorage.getItem("token"));
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };
  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><User size={20} /></span>
        <div><h2 className="text-lg font-extrabold text-[#1a0745]">Personal Details</h2><p className="text-xs text-gray-500">View and update your personal information.</p></div>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="relative">
          <Avatar name={user?.username} size="lg" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow"><Camera size={12} /></span>
        </div>
        <div><p className="font-bold text-[#1a0745]">{user?.username}</p><p className="text-xs text-gray-400">JPG, PNG (Max 2MB)</p></div>
      </div>
      <form onSubmit={save} className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name" required><InputBox icon={User} name="username" value={form.username} onChange={change} placeholder="Your full name" /></Field>
          <Field label="Email Address" required><InputBox icon={Mail} name="email" type="email" value={form.email} disabled placeholder="you@example.com" /></Field>
          <Field label="Phone Number"><InputBox icon={Phone} name="phone" type="tel" value={form.phone} onChange={change} placeholder="+91 00000 00000" /></Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={cancel} className="flex items-center gap-2 rounded-xl border border-[#d4c5f0] px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-[#faf7ff]"><X size={15} /> Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"><Save size={15} /> {saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}

function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

  useEffect(function() {
    if (!user?.user_id) { setLoading(false); return; }
    var active = true;
    api.get("/orders").then(function({ data }) {
      if (active) { setOrders(Array.isArray(data) ? data : []); setLoading(false); }
    }).catch(function() {
      if (active) { setFailed(true); setLoading(false); }
    });
    return function() { active = false; };
  }, [user?.user_id]);

  const filtered = orders.filter(function(o) {
    var q = search.trim().toLowerCase();
    if (!q) return true;
    return [o.order_id, o.id, o.status, o.tracking_number, o.courier_name].some(function(v){ return String(v || "").toLowerCase().includes(q); });
  });

  function imgSrc(img) {
    if (!img) return "";
    if (/^(https?:|data:|blob:)/i.test(img)) return img;
    return backendUrl + (img.startsWith("/") ? img : "/" + img);
  }

  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0e8ff] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package size={20} /></span>
          <div>
            <h2 className="text-lg font-extrabold text-[#1a0745]">My Orders</h2>
            <p className="text-xs text-gray-500">{loading ? "Loading..." : orders.length + " order" + (orders.length !== 1 ? "s" : "")}</p>
          </div>
        </div>
        <Link to="/ordersmain" className="hidden items-center gap-1.5 rounded-xl border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/5 sm:flex"><Package size={13} /> Track Orders</Link>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{[1,2,3].map(function(i){ return <div key={i} className="h-20 animate-pulse rounded-xl bg-[#f3eaff]/60" />; })}</div>
      ) : failed ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">Could not load your orders. Please refresh the page and try again.</p>
      ) : orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 py-8 text-center">
          <Package size={52} className="text-primary/20" strokeWidth={1.2} />
          <p className="font-semibold text-gray-500">No orders yet</p>
          <p className="text-xs text-gray-400">Your orders will appear here after checkout.</p>
          <Link to="/shop" className="mt-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle px-5 py-2 text-sm font-bold text-white shadow transition hover:brightness-110">Browse Products</Link>
        </div>
      ) : (
        <>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="search" value={search} onChange={function(e){ setSearch(e.target.value); }} placeholder="Search by order ID or status..." className="w-full rounded-xl border border-[#e2d3f5] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          {filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-400">No matching orders found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map(function(order) {
                var status  = order.status || "Order Placed";
                var stepIdx = (status === "Processing" || status === "New") ? 0 : status === "Shipped" ? 2 : Math.max(0, ORDER_STEPS.indexOf(status));
                var isOpen  = expanded === order.id;
                return (
                  <div key={order.id} className="overflow-hidden rounded-2xl border border-[#e9def5] bg-[#faf8ff] shadow-sm">
                    <button type="button" onClick={function(){ setExpanded(isOpen ? null : order.id); }} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Order ID</p>
                        <p className="mt-0.5 font-extrabold text-[#1a0745]">#{order.order_id || order.id}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={"rounded-full border px-3 py-1 text-[11px] font-bold " + statusBadgeClass(status)}>{status}</span>
                        <strong className="text-sm text-[#1a0745]">Rs.{Number(order.total_amount || 0).toLocaleString("en-IN")}</strong>
                        <ChevronRight size={16} className={"text-gray-400 transition-transform duration-200 " + (isOpen ? "rotate-90" : "")} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#e9def5] px-5 pb-5 pt-4">
                        {status !== "Cancelled" && (
                          <div className="mb-5">
                            <ol className="flex items-start justify-between gap-1">
                              {ORDER_STEPS.map(function(s, i) {
                                var done = stepIdx >= i;
                                return (
                                  <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
                                    <span className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition " + (done ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>{done ? "v" : i+1}</span>
                                    <span className={"text-[10px] font-semibold leading-tight " + (done ? "text-primary" : "text-gray-400")}>{s}</span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        )}
                        {status === "Cancelled" && (
                          <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{order.cancellation_reason || "This order was cancelled."}</p>
                        )}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-4 space-y-2">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Items</p>
                            {order.items.map(function(item, idx) {
                              var src = imgSrc(item.image);
                              return (
                                <div key={idx} className="flex items-center gap-3 rounded-xl border border-[#ede5f8] bg-white p-3">
                                  {src ? <img src={src} alt={item.product_name} className="h-12 w-12 rounded-lg border border-[#e2d3f5] object-contain" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package size={20} /></span>}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[#1a0745]">{item.product_name}</p>
                                    <p className="text-xs text-gray-400">Qty: {item.quantity}{item.variant_color ? " - " + item.variant_color : ""}{item.variant_size ? " - " + item.variant_size : ""}</p>
                                  </div>
                                  <p className="shrink-0 text-sm font-bold text-primary">Rs.{Number(item.total || 0).toLocaleString("en-IN")}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {(order.tracking_number || order.courier_name) && (
                          <div className="mt-2 rounded-xl border border-[#ede5f8] bg-white p-3 text-xs text-gray-600">
                            {order.tracking_number && <p>Tracking: <strong className="text-[#1a0745]">{order.tracking_number}</strong></p>}
                            {order.courier_name    && <p>Courier: <strong className="text-[#1a0745]">{order.courier_name}</strong></p>}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between border-t border-[#e9def5] pt-3">
                          <span className="text-xs text-gray-400">Payment: <strong className="text-gray-600">{order.payment_method || "-"}</strong><span className="mx-2">-</span><strong className={order.payment_status === "Paid" ? "text-emerald-600" : "text-amber-600"}>{order.payment_status || "Pending"}</strong></span>
                          <strong className="text-sm text-primary">Total: Rs.{Number(order.total_amount || 0).toLocaleString("en-IN")}</strong>
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

function PasswordField({ label, name, value, onChange, placeholder, show, onToggle }) {
  return (
    <Field label={label} required>
      <div className="flex items-center gap-2.5 rounded-xl border border-[#e2d3f5] bg-white px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
        <Lock size={16} className="shrink-0 text-primary/60" />
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-gray-400 transition hover:text-primary"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [saving, setSaving] = useState(false);
  const change = function(e) { setForm(function(p){ return { ...p, [e.target.name]: e.target.value }; }); };
  const toggle = function(field) { setShow(function(p){ return { ...p, [field]: !p[field] }; }); };
  const reset  = function() { setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setShow({ currentPassword: false, newPassword: false, confirmPassword: false }); };
  const save   = async function(e) {
    e.preventDefault();
    if (!form.currentPassword)       return toast.error("Current password is required.");
    if (form.newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return toast.error("Passwords do not match.");
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile/password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success(data.message || "Password changed successfully!"); reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally { setSaving(false); }
  };
  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound size={20} /></span>
        <div><h2 className="text-lg font-extrabold text-[#1a0745]">Change Password</h2><p className="text-xs text-gray-500">Update your account password.</p></div>
      </div>
      <form onSubmit={save} className="mt-6 max-w-md space-y-5">
        <PasswordField label="Current Password" name="currentPassword" value={form.currentPassword} onChange={change} placeholder="Enter current password" show={show.currentPassword} onToggle={function(){ toggle("currentPassword"); }} />
        <PasswordField label="New Password" name="newPassword" value={form.newPassword} onChange={change} placeholder="Min. 8 characters" show={show.newPassword} onToggle={function(){ toggle("newPassword"); }} />
        <PasswordField label="Confirm New Password" name="confirmPassword" value={form.confirmPassword} onChange={change} placeholder="Repeat new password" show={show.confirmPassword} onToggle={function(){ toggle("confirmPassword"); }} />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={reset} className="flex items-center gap-2 rounded-xl border border-[#d4c5f0] px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-[#faf7ff]"><X size={15} /> Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"><Save size={15} /> {saving ? "Saving..." : "Update Password"}</button>
        </div>
      </form>
    </div>
  );
}

function MyAddresses() {
  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin size={20} /></span>
        <div><h2 className="text-lg font-extrabold text-[#1a0745]">My Addresses</h2><p className="text-xs text-gray-500">Manage your saved delivery addresses.</p></div>
      </div>
      <div className="mt-10 flex flex-col items-center gap-3 py-8 text-center">
        <MapPin size={52} className="text-primary/20" strokeWidth={1.2} />
        <p className="font-semibold text-gray-500">No saved addresses yet.</p>
        <p className="text-xs text-gray-400">Addresses you use at checkout will be saved here.</p>
      </div>
    </div>
  );
}

const TABS = [
  { id: "personal", label: "Personal Details", Icon: User },
  { id: "orders",   label: "My Orders",        Icon: Package },
  { id: "address",  label: "My Addresses",     Icon: MapPin },
  { id: "password", label: "Change Password",  Icon: Lock },
];

function Account() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = function() { logout(); navigate("/login"); };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-[#e9def5] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound size={32} /></span>
          <h2 className="mt-5 text-xl font-extrabold text-[#1a0745]">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-500">Access your profile, orders and more.</p>
          <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-gradient-middle py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="My Account" align="left" />

      <div className="bg-[#faf9fc] py-8 sm:py-12">
        <PageContainer>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className="w-full shrink-0 lg:w-64">
              <div className="rounded-2xl border border-[#e9def5] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-4">
                  <Avatar name={user.username} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[#1a0745]">{user.username || "User"}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <nav className="mt-4 space-y-1">
                  {TABS.map(function({ id, label, Icon }) {
                    return (
                      <button key={id} type="button" onClick={function(){ setActiveTab(id); }}
                        className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition " + (activeTab === id ? "border-l-4 border-primary bg-[#f3eaff] text-primary" : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary")}>
                        <Icon size={18} />{label}
                      </button>
                    );
                  })}
                  <Link to="/shop" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-[#faf7ff] hover:text-primary"><ShoppingBag size={18} />Browse Shop</Link>
                  <button type="button" onClick={function(){ setShowLogout(true); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"><LogOut size={18} />Logout</button>
                </nav>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {activeTab === "personal" && <PersonalDetails user={user} setUser={setUser} />}
              {activeTab === "orders"   && <MyOrders user={user} />}
              {activeTab === "address"  && <MyAddresses />}
              {activeTab === "password" && <ChangePassword />}
            </div>
          </div>
        </PageContainer>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500"><LogOut size={26} /></span>
            <h2 className="mt-4 text-lg font-extrabold text-gray-800">Confirm Logout</h2>
            <p className="mt-2 text-sm text-gray-500">Are you sure you want to sign out?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={function(){ setShowLogout(false); }} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600">Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Account;
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Eye,
  EyeOff,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  User,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import indianStates from "./indianStates";

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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

  useEffect(function() {
    if (!user?.user_id) { setLoading(false); return; }
    var active = true;
    api.get("/orders/mine").then(function({ data }) {
      if (active) { setOrders(Array.isArray(data) ? data : []); setLoading(false); }
    }).catch(function() {
      if (active) { setFailed(true); setLoading(false); }
    });
    return function() { active = false; };
  }, [user?.user_id]);

  useEffect(function() {
    if (!selectedOrder) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedOrder(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return function() { window.removeEventListener("keydown", closeOnEscape); };
  }, [selectedOrder]);

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

  var selectedOrderStep = selectedOrder
    ? (selectedOrder.status === "Processing" || selectedOrder.status === "New")
      ? 0
      : selectedOrder.status === "Shipped"
        ? 2
        : Math.max(0, ORDER_STEPS.indexOf(selectedOrder.status || "Order Placed"))
    : 0;

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
                return (
                  <div key={order.id} className="overflow-hidden rounded-2xl border border-[#e9def5] bg-[#faf8ff] shadow-sm">
                    <button type="button" onClick={function(){ setSelectedOrder(order); }} aria-label={"View details for order " + (order.order_id || order.id)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[#f5efff]">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Order ID</p>
                        <p className="mt-0.5 font-extrabold text-[#1a0745]">#{order.order_id || order.id}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={"rounded-full border px-3 py-1 text-[11px] font-bold " + statusBadgeClass(status)}>{status}</span>
                        <strong className="text-sm text-[#1a0745]">Rs.{Number(order.total_amount || 0).toLocaleString("en-IN")}</strong>
                        <Eye size={16} className="text-primary" />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onClick={function(event) {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#f0e8ff] p-5 sm:px-7">
              <div>
                <h3 id="order-dialog-title" className="text-lg font-extrabold text-[#1a0745]">
                  Order #{selectedOrder.order_id || selectedOrder.id}
                </h3>
                <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(selectedOrder.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={"rounded-full border px-3 py-1.5 text-xs font-bold " + statusBadgeClass(selectedOrder.status || "Order Placed")}>
                  {selectedOrder.status || "Order Placed"}
                </span>
                <button
                  type="button"
                  onClick={function(){ setSelectedOrder(null); }}
                  aria-label="Close order details"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-[#faf7ff] hover:text-primary"
                >
                  <X size={20} />
                </button>
              </div>
            </header>
            <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-xl border border-[#ede5f8] bg-[#faf8ff] p-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer</h4>
                  <p className="mt-3 font-bold text-[#1a0745]">{selectedOrder.customer_name || user?.username || "Customer"}</p>
                  <p className="mt-1 break-all text-sm text-gray-600">{selectedOrder.customer_email || user?.email || "-"}</p>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.customer_phone || "-"}</p>
                </section>
                <section className="rounded-xl border border-[#ede5f8] bg-[#faf8ff] p-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Delivery address</h4>
                  <p className="mt-3 font-bold text-[#1a0745]">{selectedOrder.customer_name || user?.username || "Customer"}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {[
                      selectedOrder.street_address,
                      selectedOrder.city,
                      selectedOrder.district,
                      selectedOrder.state,
                      selectedOrder.zip_code,
                      selectedOrder.country,
                    ].filter(Boolean).join(", ") || "Address unavailable"}
                  </p>
                </section>
              </div>

              {selectedOrder.status !== "Cancelled" ? (
                <ol className="flex items-start justify-between gap-1 rounded-xl border border-[#ede5f8] p-4">
                  {ORDER_STEPS.map(function(step, index) {
                    var done = selectedOrderStep >= index;
                    return (
                      <li key={step} className="flex flex-1 flex-col items-center gap-1 text-center">
                        <span className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " + (done ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>{done ? "v" : index + 1}</span>
                        <span className={"text-[10px] font-semibold leading-tight " + (done ? "text-primary" : "text-gray-400")}>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">{selectedOrder.cancellation_reason || "This order was cancelled."}</p>
              )}

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Products</h4>
                <div className="space-y-3">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map(function(item, index) {
                    var src = imgSrc(item.image);
                    return (
                      <article key={item.product_id || item.combo_id || index} className="rounded-xl border border-[#ede5f8] bg-white p-3">
                        <div className="flex items-center gap-3">
                          {src ? <img src={src} alt={item.product_name || item.name || "Order product"} className="h-14 w-14 shrink-0 rounded-lg border border-[#e2d3f5] object-contain" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package size={20} /></span>}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#1a0745]">{item.product_name || item.name || "Product"}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              Qty: {item.quantity}
                              {item.variant_color ? " · Color: " + item.variant_color : ""}
                              {item.variant_size ? " · Size: " + item.variant_size : ""}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">Unit price: Rs.{Number(item.price || 0).toLocaleString("en-IN")}</p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-primary">Rs.{Number(item.total || 0).toLocaleString("en-IN")}</p>
                        </div>
                        {Array.isArray(item.included_products) && item.included_products.length > 0 && (
                          <div className="mt-3 border-t border-[#f0e8ff] pt-3">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Products in this combo</p>
                            <ul className="space-y-1.5">
                              {item.included_products.map(function(product) {
                                return (
                                  <li key={product.id} className="flex items-center justify-between gap-3 text-sm text-gray-600">
                                    <span>{product.name}{product.product_code ? " (" + product.product_code + ")" : ""}</span>
                                    <span className="shrink-0">Qty: {Number(product.quantity || 1) * Number(item.quantity || 1)}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {(!Array.isArray(selectedOrder.items) || selectedOrder.items.length === 0) && (
                    <p className="rounded-xl border border-[#ede5f8] p-4 text-sm text-gray-500">Product details are unavailable.</p>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[#ede5f8] bg-[#faf8ff] p-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Order summary</h4>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="text-gray-600">Order type: <strong className="text-[#1a0745]">{selectedOrder.order_type || "-"}</strong></p>
                  <p className="text-gray-600">Payment: <strong className="text-[#1a0745]">{selectedOrder.payment_method || "-"}</strong></p>
                  <p className="text-gray-600">Payment status: <strong className={selectedOrder.payment_status === "Paid" ? "text-emerald-600" : "text-amber-600"}>{selectedOrder.payment_status || "Pending"}</strong></p>
                  {selectedOrder.tracking_number && <p className="text-gray-600">Tracking: <strong className="text-[#1a0745]">{selectedOrder.tracking_number}</strong></p>}
                  {selectedOrder.courier_name && <p className="text-gray-600">Courier: <strong className="text-[#1a0745]">{selectedOrder.courier_name}</strong></p>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#e9def5] pt-3">
                  <span className="text-sm font-semibold text-gray-600">Total</span>
                  <strong className="text-lg text-primary">Rs.{Number(selectedOrder.total_amount || 0).toLocaleString("en-IN")}</strong>
                </div>
              </section>
            </div>
          </section>
        </div>
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

const EMPTY_ADDRESS = {
  recipient_name: "",
  email: "",
  phone: "",
  street_address: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  zip_code: "",
};

function MyAddresses({ user }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [form, setForm] = useState(function() { return { ...EMPTY_ADDRESS, email: user?.email || "" }; });
  const [saving, setSaving] = useState(false);

  useEffect(function() {
    let active = true;
    api.get("/checkout/addresses").then(function({ data }) {
      if (active) {
        setAddresses(Array.isArray(data) ? data : []);
        setFailed(false);
      }
    }).catch(function() {
      if (active) setFailed(true);
    }).finally(function() {
      if (active) setLoading(false);
    });
    return function() { active = false; };
  }, [user?.user_id]);

  useEffect(function() {
    if (editingAddressId === null) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event) {
      if (event.key === "Escape" && !saving) {
        setEditingAddressId(null);
        setForm({ ...EMPTY_ADDRESS, email: user?.email || "" });
      }
    }
    document.addEventListener("keydown", closeOnEscape);

    return function() {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [editingAddressId, saving, user?.email]);

  function resetForm() {
    setEditingAddressId(null);
    setForm({ ...EMPTY_ADDRESS, email: user?.email || "" });
  }

  function addAddress() {
    setForm({ ...EMPTY_ADDRESS, email: user?.email || "" });
    setEditingAddressId("new");
  }

  function editAddress(address) {
    setEditingAddressId(address.id);
    setForm({
      recipient_name: address.recipient_name || "",
      email: address.email || user?.email || "",
      phone: address.phone || "",
      street_address: address.street_address || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      country: address.country || "India",
      zip_code: address.zip_code || "",
    });
  }

  function changeAddress(event) {
    const { name, value } = event.target;
    setForm(function(current) { return { ...current, [name]: value }; });
  }

  async function saveAddress(event) {
    event.preventDefault();
    setSaving(true);
    const isNewAddress = editingAddressId === "new";
    try {
      const { data } = !isNewAddress
        ? await api.put("/checkout/addresses/" + editingAddressId, form)
        : await api.post("/checkout/addresses", form);
      setAddresses(function(current) {
        if (!isNewAddress) {
          return current.map(function(address) {
            return address.id === editingAddressId ? data : address;
          });
        }
        return [data, ...current];
      });
      toast.success(isNewAddress ? "Address saved successfully." : "Address updated successfully.");
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save this address.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(address) {
    if (!window.confirm("Delete this saved address?")) return;
    try {
      await api.delete("/checkout/addresses/" + address.id);
      setAddresses(function(current) {
        return current.filter(function(item) { return item.id !== address.id; });
      });
      if (editingAddressId === address.id) resetForm();
      toast.success("Address deleted successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete this address.");
    }
  }

  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0e8ff] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin size={20} /></span>
          <div><h2 className="text-lg font-extrabold text-[#1a0745]">My Addresses</h2><p className="text-xs text-gray-500">Manage your saved delivery addresses.</p></div>
        </div>
        <button type="button" onClick={addAddress} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-dark">
          <Plus size={15} /> Add address
        </button>
      </div>
      {editingAddressId !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={function(event) {
            if (event.target === event.currentTarget && !saving) resetForm();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-dialog-title"
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#f0e8ff] p-5 sm:px-7">
              <div>
                <h3 id="address-dialog-title" className="text-lg font-extrabold text-[#1a0745]">
                  {editingAddressId === "new" ? "Add an address" : "Edit address"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">Enter your delivery address details.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close address form"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-[#faf7ff] hover:text-primary disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>
            <form onSubmit={saveAddress} className="flex min-h-0 flex-col">
              <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:px-7">
                <Field label="Full name" required><InputBox icon={User} name="recipient_name" value={form.recipient_name} onChange={changeAddress} maxLength={160} required /></Field>
                <Field label="Phone number" required><InputBox icon={Phone} name="phone" type="tel" value={form.phone} onChange={changeAddress} maxLength={32} required /></Field>
                <Field label="Email"><InputBox icon={Mail} name="email" type="email" value={form.email} onChange={changeAddress} maxLength={191} autoComplete="email" /></Field>
                <div className="sm:col-span-2">
                  <Field label="Street address" required>
                    <textarea name="street_address" value={form.street_address} onChange={changeAddress} maxLength={512} required className="min-h-20 w-full rounded-xl border border-[#e2d3f5] bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </Field>
                </div>
                <Field label="City" required><InputBox name="city" value={form.city} onChange={changeAddress} maxLength={120} required /></Field>
                <Field label="District"><InputBox name="district" value={form.district} onChange={changeAddress} maxLength={120} /></Field>
                <Field label="State" required>
                  <SelectBox icon={MapPin} name="state" value={form.state} onChange={changeAddress} required>
                    <option value="" disabled>Select a state or union territory</option>
                    {form.state && !indianStates.includes(form.state) && <option value={form.state}>{form.state}</option>}
                    {indianStates.map(function(state) { return <option key={state} value={state}>{state}</option>; })}
                  </SelectBox>
                </Field>
                <Field label="Postal code" required><InputBox name="zip_code" value={form.zip_code} onChange={changeAddress} maxLength={24} required /></Field>
                <Field label="Country" required><InputBox name="country" value={form.country} onChange={changeAddress} maxLength={120} required /></Field>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#f0e8ff] p-5 sm:px-7">
                <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-[#d4c5f0] px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-[#faf7ff] disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60">
                  <Save size={15} /> {saving ? "Saving..." : "Save address"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading saved addresses...</p>
      ) : failed ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">Could not load your addresses. Please refresh the page and try again.</p>
      ) : addresses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 py-8 text-center">
          <MapPin size={48} className="text-primary/20" strokeWidth={1.2} />
          <p className="font-semibold text-gray-500">No saved addresses yet.</p>
          <p className="text-xs text-gray-400">Addresses you use at checkout will be saved here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map(function(address) {
            return (
              <article key={address.id} className="rounded-xl border border-[#e9def5] bg-[#faf8ff] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1a0745]">{address.recipient_name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{address.phone}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={function(){ editAddress(address); }} aria-label="Edit address" className="rounded-lg border border-[#e2d3f5] bg-white p-2 text-primary hover:bg-primary/5"><Pencil size={15} /></button>
                    <button type="button" onClick={function(){ deleteAddress(address); }} aria-label="Delete address" className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {[address.street_address, address.city, address.district, address.state, address.zip_code, address.country].filter(Boolean).join(", ")}
                </p>
              </article>
            );
          })}
        </div>
      )}
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
            <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-64 lg:self-start">
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
                  {/* <Link to="/shop" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-[#faf7ff] hover:text-primary"><ShoppingBag size={18} />Browse Shop</Link> */}
                  <button type="button" onClick={function(){ setShowLogout(true); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"><LogOut size={18} />Logout</button>
                </nav>
              </div>
            </aside>

            <div className="min-w-0 flex-1 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
              {activeTab === "personal" && <PersonalDetails user={user} setUser={setUser} />}
              {activeTab === "orders"   && <MyOrders user={user} />}
              {activeTab === "address"  && <MyAddresses key={user.user_id} user={user} />}
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
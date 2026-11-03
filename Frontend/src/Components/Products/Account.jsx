import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
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
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Truck,
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
  const [statusFilter, setStatusFilter] = useState("All");
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
    var matchesSearch = !q || [o.order_id, o.id, o.status, o.tracking_number, o.courier_name]
      .concat((Array.isArray(o.items) ? o.items : []).map(function(item) { return item.product_name || item.name; }))
      .some(function(v){ return String(v || "").toLowerCase().includes(q); });
    return matchesSearch && (statusFilter === "All" || o.status === statusFilter);
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
  var selectedOrderItems = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];
  var selectedOrderSubtotal = selectedOrderItems.reduce(function(total, item) {
    var lineTotal = item.total === undefined || item.total === null
      ? Number(item.price || 0) * Number(item.quantity || 0)
      : Number(item.total);
    return total + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);
  var selectedOrderDiscount = Math.max(0, Number(selectedOrder?.discount_amount) || 0);

  return (
    <div className="rounded-2xl border border-[#e9def5] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 border-b border-[#f0e8ff] pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e3ff] text-[#8509c9]"><Package size={20} /></span>
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#1a0745]">My Orders</h2>
            <p className="text-xs text-gray-500">Track, manage and view all your orders in one place.</p>
          </div>
        </div>
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b65aa]" size={15} />
              <input
                type="search"
                value={search}
                onChange={function(e){ setSearch(e.target.value); }}
                placeholder="Search by order ID or product name..."
                aria-label="Search by order ID or product name"
                className="w-full rounded-xl border border-[#e9ddf6] bg-white py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-[#a536df] focus:ring-2 focus:ring-[#a536df]/10"
              />
            </div>
            <label className="relative flex shrink-0 items-center">
              <span className="sr-only">Filter orders by status</span>
              <select
                value={statusFilter}
                onChange={function(event){ setStatusFilter(event.target.value); }}
                className="w-full appearance-none rounded-xl border border-[#e9ddf6] bg-[#fcfaff] py-2.5 pl-9 pr-9 text-xs font-bold text-[#321454] outline-none transition focus:border-[#a536df] sm:w-36"
              >
                <option value="All">All Orders</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipping">Shipping</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Package size={14} className="pointer-events-none absolute left-3 text-[#8509c9]" />
              <ChevronDown size={14} className="pointer-events-none absolute right-3 text-[#8b65aa]" />
            </label>
          </div>
          {filtered.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[#e9ddf6] py-8 text-center text-sm text-gray-400">No matching orders found.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {filtered.map(function(order) {
                var status = order.status || "Order Placed";
                var statusIconClass = status === "Cancelled"
                  ? "bg-rose-100 text-rose-600"
                  : status === "Shipping" || status === "Shipped" || status === "Out for Delivery"
                    ? "bg-orange-100 text-orange-600"
                    : status === "Delivered"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-violet-100 text-violet-700";
                return (
                  <article key={order.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-[#eee4f8] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(54,22,82,0.04)] transition hover:border-[#d8b8f5] sm:grid-cols-[minmax(140px,1fr)_minmax(100px,.75fr)_auto_auto] sm:gap-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + statusIconClass}>
                        <Package size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Order ID</p>
                        <p className="truncate text-xs font-extrabold text-[#211044]">#{order.order_id || order.id}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-slate-500"><CalendarDays size={10} /> {formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    <div className="col-start-1 row-start-2 min-w-0 pl-1 text-left sm:col-auto sm:row-auto sm:pl-0">
                      <p className="text-[9px] font-semibold text-slate-500">Total Amount</p>
                      <p className="text-xs font-extrabold text-[#7100b5]">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</p>
                    </div>

                    <span className={"col-start-2 row-start-1 max-w-[125px] truncate rounded-full border px-2.5 py-1 text-center text-[9px] font-extrabold sm:col-auto sm:row-auto sm:max-w-none " + statusBadgeClass(status)}>
                      {status}
                    </span>

                    <button
                      type="button"
                      onClick={function(){ setSelectedOrder(order); }}
                      aria-label={"View details for order " + (order.order_id || order.id)}
                      className="col-start-2 row-start-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#7900bd] bg-gradient-to-r from-[#8c12c6] to-[#6500a9] px-3 py-2 text-[10px] font-extrabold text-white transition hover:bg-none hover:from-white hover:to-white hover:text-[#7900bd] sm:col-auto sm:row-auto sm:min-w-[98px]"
                    >
                      View Details <ChevronRight size={13} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#150528]/55 p-3 backdrop-blur-sm sm:p-6"
          onClick={function(event) {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#e9d8ff] bg-white shadow-[0_30px_100px_rgba(27,4,53,0.35)]"
          >
            <header className="relative flex items-center justify-between gap-4 overflow-hidden bg-gradient-to-r from-[#5b08b5] via-[#8509c9] to-[#4b078f] px-5 py-4 text-white sm:px-8 sm:py-5">
              <span className="pointer-events-none absolute -right-8 -top-20 h-48 w-72 rotate-[-18deg] rounded-full border-[24px] border-white/5" />
              <div className="relative flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 sm:h-14 sm:w-14">
                  <Package size={27} />
                </span>
                <div className="min-w-0">
                  <h3 id="order-dialog-title" className="text-xl font-extrabold sm:text-2xl">Order Details</h3>
                  <p className="mt-0.5 text-xs text-purple-100 sm:text-sm">View complete information about your order</p>
                </div>
              </div>
              <div className="relative flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={function(){ setSelectedOrder(null); }}
                  aria-label="Close order details"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6505a7] shadow-sm transition hover:scale-105 hover:bg-purple-50 sm:h-10 sm:w-10"
                >
                  <X size={20} />
                </button>
              </div>
            </header>
            <div className="min-h-0 overflow-y-auto bg-[#fdfbff]">
              <div className="grid grid-cols-2 gap-3 border-b border-[#eee2fc] bg-white px-5 py-4 sm:grid-cols-4 sm:gap-0 sm:px-7">
                <div className="flex min-w-0 items-center gap-3 sm:border-r sm:border-[#e8d9f9] sm:px-4 sm:first:pl-0">
                  <span className="hidden text-[#8509c9] sm:block"><Package size={22} /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Order ID</p>
                    <p className="truncate text-sm font-extrabold text-[#160b34]">#{selectedOrder.order_id || selectedOrder.id}</p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 sm:border-r sm:border-[#e8d9f9] sm:px-4">
                  <CalendarDays size={21} className="hidden shrink-0 text-[#8509c9] sm:block" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Order Date</p>
                    <p className="truncate text-sm font-bold text-[#160b34]">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 sm:border-r sm:border-[#e8d9f9] sm:px-4">
                  <CreditCard size={21} className="hidden shrink-0 text-[#8509c9] sm:block" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Payment</p>
                    <span className={"mt-0.5 inline-flex rounded-full px-3 py-0.5 text-xs font-bold " + (selectedOrder.payment_status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {selectedOrder.payment_status || "Pending"}
                    </span>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 sm:px-4 sm:pr-0">
                  <Truck size={23} className="hidden shrink-0 text-[#8509c9] sm:block" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Order Status</p>
                    <span className={"mt-0.5 inline-flex max-w-full truncate rounded-full border px-3 py-0.5 text-xs font-bold " + statusBadgeClass(selectedOrder.status || "Order Placed")}>
                      {selectedOrder.status || "Order Placed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-4 sm:px-7 sm:pt-5">
                {selectedOrder.status !== "Cancelled" ? (
                  <section className="relative rounded-2xl border border-[#ead8ff] bg-gradient-to-r from-[#fcf8ff] via-[#f7efff] to-[#fcf8ff] px-3 py-5 sm:px-6 sm:py-6">
                    <span className="absolute left-[10%] right-[10%] top-[2.15rem] h-1 rounded-full bg-[#ded6eb] sm:top-[2.55rem]" />
                    <span
                      className="absolute left-[10%] top-[2.15rem] h-1 rounded-full bg-gradient-to-r from-[#a30be0] to-[#6900bb] transition-all sm:top-[2.55rem]"
                      style={{ width: `${selectedOrderStep * 20}%` }}
                    />
                    <ol className="relative grid grid-cols-5 gap-1">
                      {ORDER_STEPS.map(function(step, index) {
                        var complete = selectedOrderStep > index;
                        var current = selectedOrderStep === index;
                        return (
                          <li key={step} className="flex min-w-0 flex-col items-center text-center">
                            <span className={"z-10 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-[#f8f2ff] sm:h-9 sm:w-9 " + (complete || current ? "bg-gradient-to-br from-[#ad16e5] to-[#6900bd] text-white shadow-md shadow-purple-300/60" : "bg-[#c6c5d1] text-white")}>
                              {step === "Out for Delivery" && current ? <Truck size={15} /> : complete ? <Check size={17} strokeWidth={3} /> : current ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : <Check size={15} />}
                            </span>
                            <span className={"mt-2 text-[9px] font-bold leading-tight sm:text-xs " + (complete || current ? "text-[#21103e]" : "text-slate-400")}>{step}</span>
                            {current && <span className="mt-1 max-w-full truncate rounded-full bg-[#7900bd] px-2 py-0.5 text-[8px] font-bold text-white sm:text-[10px]">{step}</span>}
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ) : (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <p className="font-bold">Order cancelled</p>
                    <p className="mt-1">{selectedOrder.cancellation_reason || "This order was cancelled."}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 px-4 py-4 sm:px-7 sm:pb-6 lg:grid-cols-[1.4fr_0.9fr]">
                <section className="overflow-hidden rounded-2xl border border-[#e4d1ff] bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-[#eee3fb] bg-gradient-to-r from-[#fbf6ff] to-white px-4 py-3">
                    <ShoppingCart size={20} className="text-[#8509c9]" />
                    <h4 className="font-extrabold text-[#1a0745]">Items <span className="text-[#8509c9]">({selectedOrderItems.length})</span></h4>
                  </div>
                  <div className="divide-y divide-[#eee7f6] px-4">
                    {selectedOrderItems.map(function(item, index) {
                      var src = imgSrc(item.image);
                      return (
                        <article key={item.product_id || item.combo_id || index} className="py-4">
                          <div className="flex items-center gap-3">
                            {src
                              ? <img src={src} alt={item.product_name || item.name || "Order product"} className="h-16 w-16 shrink-0 rounded-xl border border-[#eee4f9] bg-[#fcf9ff] object-contain p-1.5 sm:h-20 sm:w-20" />
                              : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#eee4f9] bg-[#fcf9ff] text-[#8509c9] sm:h-20 sm:w-20"><Package size={25} /></span>}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-extrabold text-[#181034] sm:text-base">{item.product_name || item.name || "Product"}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.variant_color ? `Color: ${item.variant_color}` : ""}
                                {item.variant_color && item.variant_size ? " · " : ""}
                                {item.variant_size ? `Size: ${item.variant_size}` : ""}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-600">Qty: {item.quantity} · ₹{Number(item.price || 0).toLocaleString("en-IN")} each</p>
                            </div>
                            <p className="shrink-0 text-sm font-extrabold text-[#160b34] sm:text-base">₹{Number(item.total || 0).toLocaleString("en-IN")}</p>
                          </div>
                          {Array.isArray(item.included_products) && item.included_products.length > 0 && (
                            <div className="ml-[4.75rem] mt-3 rounded-xl bg-[#faf6ff] p-3 sm:ml-[5.75rem]">
                              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#8509c9]">Products in this combo</p>
                              <ul className="space-y-1.5">
                                {item.included_products.map(function(product) {
                                  return (
                                    <li key={product.id} className="flex justify-between gap-3 text-xs text-slate-600">
                                      <span>{product.name}{product.product_code ? ` (${product.product_code})` : ""}</span>
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
                    {selectedOrderItems.length === 0 && (
                      <p className="py-5 text-sm text-slate-500">Product details are unavailable.</p>
                    )}
                  </div>
                </section>

                <div className="space-y-3">
                  <section className="rounded-2xl border border-[#e4d1ff] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-[#8509c9]" />
                        <h4 className="font-extrabold text-[#1a0745]">Shipping Address</h4>
                      </div>
                      <span className="rounded-full bg-[#f3e4ff] px-2.5 py-1 text-[10px] font-bold text-[#7900bd]">Delivery</span>
                    </div>
                    <div className="mt-3 pl-7 text-xs leading-5 text-slate-600">
                      <p className="font-extrabold text-[#181034]">{selectedOrder.customer_name || user?.username || "Customer"}</p>
                      <p>{[
                        selectedOrder.street_address,
                        selectedOrder.city,
                        selectedOrder.district,
                        selectedOrder.state,
                        selectedOrder.zip_code,
                        selectedOrder.country,
                      ].filter(Boolean).join(", ") || "Address unavailable"}</p>
                      {selectedOrder.customer_phone && <p className="mt-1 font-semibold text-[#4c3267]">{selectedOrder.customer_phone}</p>}
                      {(selectedOrder.customer_email || user?.email) && <p className="break-all">{selectedOrder.customer_email || user?.email}</p>}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-[#e4d1ff] bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-[#eee3fb] bg-gradient-to-r from-[#fbf6ff] to-white px-4 py-3">
                      <FileText size={19} className="text-[#8509c9]" />
                      <h4 className="font-extrabold text-[#1a0745]">Price Summary</h4>
                    </div>
                    <div className="space-y-2.5 px-4 py-3 text-xs sm:text-sm">
                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Item Total ({selectedOrderItems.length} {selectedOrderItems.length === 1 ? "item" : "items"})</span>
                        <strong className="text-[#181034]">₹{selectedOrderSubtotal.toLocaleString("en-IN")}</strong>
                      </div>
                      {selectedOrderDiscount > 0 && (
                        <div className="flex justify-between gap-3 text-emerald-700">
                          <span>Discount{selectedOrder.coupon_code ? ` (${selectedOrder.coupon_code})` : ""}</span>
                          <strong>− ₹{selectedOrderDiscount.toLocaleString("en-IN")}</strong>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 border-t border-[#eee7f6] pt-3 text-sm font-extrabold text-[#7100b5]">
                        <span>Total {selectedOrder.payment_status === "Paid" ? "Paid" : "Due"}</span>
                        <span>₹{Number(selectedOrder.total_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </section>

                  {(selectedOrder.tracking_number || selectedOrder.courier_name) && (
                    <section className="rounded-2xl border border-[#e4d1ff] bg-white p-4 shadow-sm">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8509c9]">Shipment</h4>
                      {selectedOrder.courier_name && <p className="mt-2 text-sm text-slate-600">Courier: <strong className="text-[#181034]">{selectedOrder.courier_name}</strong></p>}
                      {selectedOrder.tracking_number && <p className="mt-1 break-all text-sm text-slate-600">Tracking: <strong className="text-[#181034]">{selectedOrder.tracking_number}</strong></p>}
                    </section>
                  )}
                </div>
              </div>
            </div>
            <footer className="flex justify-end border-t border-[#eee2fc] bg-white px-5 py-3 sm:px-7">
              <button
                type="button"
                onClick={function(){ setSelectedOrder(null); }}
                className="rounded-xl bg-gradient-to-r from-[#8709c7] to-[#5c08a7] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-200 transition hover:brightness-110"
              >
                Close details
              </button>
            </footer>
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
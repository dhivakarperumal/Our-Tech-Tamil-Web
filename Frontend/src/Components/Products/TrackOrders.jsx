import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Package, Search, Truck } from "lucide-react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const ORDER_STEPS = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];
const EMPTY_ORDERS = [];

function getStatusClasses(status) {
  if (status === "Delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "Cancelled") return "bg-rose-50 text-rose-700";
  if (status === "Out for Delivery") return "bg-cyan-50 text-cyan-700";
  if (status === "Shipping" || status === "Shipped") return "bg-amber-50 text-amber-700";
  return "bg-violet-50 text-violet-700";
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function TrackOrders() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [orderState, setOrderState] = useState({ userId: null, orders: [], loading: true, failed: false });
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    if (authLoading || !user?.user_id) return undefined;
    const userId = user.user_id;
    api.get("/orders")
      .then(({ data }) => {
        if (active) {
          setOrderState({ userId, orders: Array.isArray(data) ? data : [], loading: false, failed: false });
        }
      })
      .catch((error) => {
        console.error("Failed to load customer orders:", error);
        if (active) setOrderState({ userId, orders: [], loading: false, failed: true });
      })

    return () => {
      active = false;
    };
  }, [authLoading, user?.user_id]);

  const orderStateMatchesUser = orderState.userId === user?.user_id;
  const orders = orderStateMatchesUser ? orderState.orders : EMPTY_ORDERS;
  const loading = authLoading || Boolean(user?.user_id) && (!orderStateMatchesUser || orderState.loading);
  const failed = orderStateMatchesUser && orderState.failed;

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) =>
      [order.order_id, order.id, order.status, order.tracking_number, order.courier_name]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [orders, search]);

  return (
    <>
      <PageHeader title="Track Your Orders" align="left" />
      <PageContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck size={23} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-text-primary sm:text-2xl">Order tracking</h1>
              <p className="mt-1 text-sm text-text-secondary">View delivery progress and tracking information for your orders.</p>
            </div>
          </div>

          {!authLoading && !user ? (
            <div className="rounded-2xl border border-border bg-white p-8 text-center">
              <Package className="mx-auto mb-4 text-primary" size={40} aria-hidden="true" />
              <h2 className="text-lg font-bold text-text-primary">Sign in to track your orders</h2>
              <p className="mt-2 text-sm text-text-secondary">Your order history is available after you sign in.</p>
              <Link to="/login" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
                Sign in
              </Link>
            </div>
          ) : authLoading || loading ? (
            <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-text-secondary" role="status">
              Loading your orders...
            </div>
          ) : failed ? (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-700" role="alert">
              <AlertCircle size={20} aria-hidden="true" />
              Could not load your orders. Please refresh the page to try again.
            </div>
          ) : (
            <>
              <label className="relative mb-5 block">
                <span className="sr-only">Search orders</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by order ID, status, or tracking number"
                  className="w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-8 text-center">
                  <Package className="mx-auto mb-4 text-slate-300" size={40} aria-hidden="true" />
                  <h2 className="font-bold text-text-primary">{orders.length ? "No matching orders" : "No orders yet"}</h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    {orders.length ? "Try another order ID or tracking number." : "Your orders will appear here after checkout."}
                  </p>
                  {!orders.length && (
                    <Link to="/shop" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
                      Browse products
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const status = order.status || "Order Placed";
                    const currentStep = status === "Processing" || status === "New"
                      ? 0
                      : status === "Shipped"
                        ? 2
                        : ORDER_STEPS.indexOf(status);

                    return (
                      <article key={order.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Order</p>
                            <h2 className="mt-1 font-extrabold text-text-primary">#{order.order_id || order.id}</h2>
                            <p className="mt-1 text-xs text-text-secondary">Placed {formatDate(order.created_at)}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(status)}`}>{status}</span>
                        </div>

                        {status === "Cancelled" ? (
                          <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                            {order.cancellation_reason || "This order was cancelled."}
                          </p>
                        ) : (
                          <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label={`Order progress: ${status}`}>
                            {ORDER_STEPS.map((step, index) => {
                              const complete = currentStep >= index;
                              return (
                                <li key={step} className="flex items-center gap-2 sm:flex-col sm:items-start">
                                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${complete ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                                    {complete ? <Check size={15} aria-hidden="true" /> : <span className="text-xs">{index + 1}</span>}
                                  </span>
                                  <span className={`text-xs font-semibold ${complete ? "text-primary" : "text-slate-400"}`}>{step}</span>
                                </li>
                              );
                            })}
                          </ol>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                          <div className="text-text-secondary">
                            {order.tracking_number && <span>Tracking: <strong className="text-text-primary">{order.tracking_number}</strong></span>}
                            {order.courier_name && <span className="ml-3">Courier: <strong className="text-text-primary">{order.courier_name}</strong></span>}
                            {!order.tracking_number && !order.courier_name && <span>{order.items?.length || 0} items</span>}
                          </div>
                          <strong className="text-text-primary">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</strong>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}

export default TrackOrders;

import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageContainer from "../CommenComponents/PageContainer";

const formatPrice = (value) => Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Checkout() {
  const { user } = useContext(AuthContext);
  const { cart, loadingCart, fetchCart } = useContext(StoreContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [form, setForm] = useState({
    recipient_name: user?.username || user?.name || "",
    customer_email: user?.email || "",
    phone: user?.phone || "",
    street_address: "",
    city: "",
    district: "",
    state: "",
    zip_code: "",
  });
  const orderTotal = cart.reduce((total, item) => total + Number(item.subtotal ?? item.total_price ?? 0), 0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/checkout", form);
      setPlacedOrder(data);
      await fetchCart();
      toast.success("Order placed successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to place your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <PageContainer className="py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-text-primary">Sign in to checkout</h1>
          <p className="mt-2 text-sm text-text-secondary">Please sign in to place your order.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">
            Sign in
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (placedOrder) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <FiCheckCircle className="mx-auto text-emerald-600" size={52} />
          <h1 className="mt-4 text-2xl font-extrabold text-text-primary">Order placed!</h1>
          <p className="mt-2 text-sm text-text-secondary">Your order number is <strong>{placedOrder.order_id}</strong>.</p>
          <p className="mt-1 text-sm text-text-secondary">Payment: Cash on Delivery</p>
          <p className="mt-4 text-lg font-extrabold text-primary">₹{formatPrice(placedOrder.total_amount)}</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
            Continue Shopping
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!loadingCart && cart.length === 0) {
    return (
      <PageContainer className="py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-text-primary">Your cart is empty</h1>
          <p className="mt-2 text-sm text-text-secondary">Add products before continuing to checkout.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">
            Continue Shopping
          </Link>
        </div>
      </PageContainer>
    );
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-sm text-text-primary outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <PageContainer className="py-8 sm:py-12">
      <Link to="/cart" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary">
        <FiArrowLeft size={16} /> Back to cart
      </Link>
      <h1 className="text-2xl font-extrabold text-text-primary sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-text-secondary">Enter your delivery details to place the order.</p>

      {loadingCart ? (
        <div className="mt-6 rounded-xl border border-border bg-white p-8 text-center text-sm text-text-secondary">Loading your cart...</div>
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-7">
            <section>
              <h2 className="text-lg font-bold text-text-primary">Delivery address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-text-primary sm:col-span-2">
                  Full name *
                  <input className={inputClass} name="recipient_name" value={form.recipient_name} onChange={handleChange} maxLength={160} autoComplete="name" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  Phone number *
                  <input className={inputClass} name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={32} autoComplete="tel" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  Email
                  <input className={inputClass} name="customer_email" type="email" value={form.customer_email} onChange={handleChange} maxLength={191} autoComplete="email" />
                </label>
                <label className="text-sm font-semibold text-text-primary sm:col-span-2">
                  Street address *
                  <textarea className={`${inputClass} min-h-24 resize-y`} name="street_address" value={form.street_address} onChange={handleChange} maxLength={512} autoComplete="street-address" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  City *
                  <input className={inputClass} name="city" value={form.city} onChange={handleChange} maxLength={120} autoComplete="address-level2" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  District
                  <input className={inputClass} name="district" value={form.district} onChange={handleChange} maxLength={120} />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  State *
                  <input className={inputClass} name="state" value={form.state} onChange={handleChange} maxLength={120} autoComplete="address-level1" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  Postal code *
                  <input className={inputClass} name="zip_code" value={form.zip_code} onChange={handleChange} maxLength={24} autoComplete="postal-code" required />
                </label>
              </div>
            </section>

            <section className="rounded-xl bg-gray-50 p-4">
              <h2 className="text-sm font-bold text-text-primary">Payment method</h2>
              <p className="mt-1 text-sm text-text-secondary">Cash on Delivery</p>
            </section>

            <button type="submit" disabled={isSubmitting || !cart.length} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
              <FiLock size={16} />
              {isSubmitting ? "Placing order..." : `Place Order · ₹${formatPrice(orderTotal)}`}
            </button>
          </form>

          <aside className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-text-primary">Order summary</h2>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0">
                  <div className="flex min-w-0 gap-3">
                    <img src={item.image || "https://ui-avatars.com/api/?name=Product&background=f3f4f6&color=240046"} alt="" className="h-14 w-12 shrink-0 rounded-lg bg-gray-50 object-contain" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold text-text-primary">{item.name}</p>
                      <p className="mt-1 text-xs text-text-secondary">Qty: {item.quantity}{item.colorName ? ` · ${item.colorName}` : ""}{item.size ? ` · ${item.size}` : ""}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-text-primary">₹{formatPrice(item.subtotal ?? item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-extrabold text-text-primary">
              <span>Total</span><span>₹{formatPrice(orderTotal)}</span>
            </div>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}

export default Checkout;

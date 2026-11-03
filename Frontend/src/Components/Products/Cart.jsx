import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import PageContainer from "../CommenComponents/PageContainer";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";

const formatPrice = (value) => Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Cart() {
  const { user } = useContext(AuthContext);
  const { cart, loadingCart, clearCart, removeFromCart, updateCartQuantity } = useContext(StoreContext);
  const navigate = useNavigate();
  const totalItems = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const totalAmount = cart.reduce((total, item) => total + Number(item.subtotal ?? item.total_price ?? 0), 0);

  if (!user) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
          <FiShoppingCart className="mx-auto mb-4 text-primary" size={40} />
          <h1 className="text-xl font-bold text-text-primary">Sign in to view your cart</h1>
          <p className="mt-2 text-sm text-text-secondary">Your cart is saved to your customer account.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
            Sign in
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/shop" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary">
            <FiArrowLeft size={16} /> Continue shopping
          </Link>
          <h1 className="text-2xl font-extrabold text-text-primary sm:text-3xl">Your Cart</h1>
          <p className="mt-1 text-sm text-text-secondary">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <FiTrash2 size={16} /> Clear cart
          </button>
        )}
      </div>

      {loadingCart ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center text-sm text-text-secondary">
          Loading your cart...
        </div>
      ) : cart.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white px-6 py-16 text-center">
          <FiShoppingCart className="mx-auto mb-4 text-primary/50" size={44} />
          <h2 className="text-lg font-bold text-text-primary">Your cart is empty</h2>
          <p className="mt-2 text-sm text-text-secondary">Browse the shop and add products to your cart.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Product Image</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Product Name</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Product Code</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">MRP</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Offer Price</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Quantity</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Subtotal</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <img src={item.image || "https://ui-avatars.com/api/?name=Product&background=f3f4f6&color=240046"} alt={item.name || "Product"} className="h-16 w-16 rounded-lg bg-gray-50 object-contain" />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-text-primary">{item.name || "Product"}</p>
                        {(item.colorName || item.size) && <p className="mt-1 text-xs text-text-secondary">{[item.colorName, item.size].filter(Boolean).join(" · ")}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{item.product_code || "—"}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary">₹{formatPrice(item.mrp)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-text-primary">₹{formatPrice(item.offer_price ?? item.price)}</td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
                          <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={Number(item.quantity) <= 1} onClick={() => updateCartQuantity(item.id, Number(item.quantity) - 1)} className="p-2 text-text-primary hover:bg-gray-50 disabled:opacity-40"><FiMinus size={14} /></button>
                          <span className="min-w-9 text-center text-sm font-semibold">{item.quantity}</span>
                          <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateCartQuantity(item.id, Number(item.quantity) + 1)} className="p-2 text-text-primary hover:bg-gray-50"><FiPlus size={14} /></button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary">₹{formatPrice(item.subtotal ?? item.total_price)}</td>
                      <td className="px-5 py-4">
                        <button type="button" aria-label={`Remove ${item.name} from cart`} onClick={() => removeFromCart(item.id)} className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"><FiTrash2 size={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {cart.map((item) => (
              <article key={item.id} className="flex gap-3 rounded-xl border border-border bg-white p-3">
                <img src={item.image || "https://ui-avatars.com/api/?name=Product&background=f3f4f6&color=240046"} alt={item.name || "Product"} className="h-24 w-20 shrink-0 rounded-lg bg-gray-50 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-sm font-bold text-text-primary">{item.name || "Product"}</h2>
                    <button type="button" aria-label={`Remove ${item.name} from cart`} onClick={() => removeFromCart(item.id)} className="shrink-0 rounded p-1 text-gray-400 hover:text-rose-600"><FiTrash2 size={16} /></button>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">Code: {item.product_code || "—"}</p>
                  <p className="mt-1 text-xs text-text-secondary">MRP: ₹{formatPrice(item.mrp)}</p>
                  <p className="text-sm font-bold text-primary">Offer: ₹{formatPrice(item.offer_price ?? item.price)}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
                      <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={Number(item.quantity) <= 1} onClick={() => updateCartQuantity(item.id, Number(item.quantity) - 1)} className="p-1.5 disabled:opacity-40"><FiMinus size={13} /></button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateCartQuantity(item.id, Number(item.quantity) + 1)} className="p-1.5"><FiPlus size={13} /></button>
                    </div>
                    <span className="text-sm font-extrabold text-text-primary">₹{formatPrice(item.subtotal ?? item.total_price)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-5 ml-auto max-w-md rounded-2xl border border-border bg-white p-5">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Items</span><span>{totalItems}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-extrabold text-text-primary">
              <span>Grand Total</span><span>₹{formatPrice(totalAmount)}</span>
            </div>
            <button type="button" onClick={() => navigate("/checkout")} className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
              Proceed to Checkout
            </button>
            <Link to="/shop" className="mt-2 block w-full rounded-lg border border-primary px-4 py-3 text-center text-sm font-bold text-primary transition hover:bg-primary/5">
              Continue Shopping
            </Link>
          </section>
        </>
      )}
    </PageContainer>
  );
}

export default Cart;

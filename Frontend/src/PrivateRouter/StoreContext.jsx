import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { toast } from "react-hot-toast";
import api from "../api";
import { AuthContext } from "./AuthContext";
import { getProductStock } from "../utils/stock";

export const StoreContext = createContext();

const resolveStoredImage = (image) => {
    if (!image || typeof image !== "string" || /^(https?:|data:|blob:)/i.test(image)) return image;
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
    return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

const getFirstStoredImage = (images) => {
    if (!images) return null;
    try {
        const parsed = typeof images === "string" ? JSON.parse(images) : images;
        return Array.isArray(parsed) ? parsed[0] || null : parsed;
    } catch {
        return typeof images === "string" ? images : null;
    }
};

export const StoreProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loadingCart, setLoadingCart] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    const [productsCache, setProductsCache] = useState([]);
    const [videosCache, setVideosCache] = useState([]);
    const [bannersCache, setBannersCache] = useState({});
    const [categoriesCache, setCategoriesCache] = useState([]);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    // ─── Fetch cart from backend ─────────────────────────────────
    const fetchCart = useCallback(async () => {
        if (!user?.user_id) { setCart([]); return; }
        try {
            setLoadingCart(true);
            const res = await api.get("/cart");
            const items = Array.isArray(res.data) ? res.data : res.data?.items;
            setCart((Array.isArray(items) ? items : []).map(item => ({
                ...item,
                name: item.product_name || item.name,
                image: resolveStoredImage(item.product_image || item.image),
                price: Number(item.offer_price ?? item.price ?? 0),
                total_price: Number(item.subtotal ?? item.total_price ?? 0),
            })));
        } catch (err) {
            console.error("Fetch cart error:", err);
            toast.error(err.response?.data?.message || "Failed to load your cart");
        } finally {
            setLoadingCart(false);
        }
    }, [user?.user_id]);

    // ─── Fetch wishlist from backend ─────────────────────────────
    const fetchWishlist = useCallback(async () => {
        if (!user?.user_id) { setWishlist([]); return; }
        try {
            setLoadingWishlist(true);
            const res = await api.get(`/wishlist/${user.user_id}`);
            setWishlist(res.data);
        } catch (err) {
            console.error("Fetch wishlist error:", err);
        } finally {
            setLoadingWishlist(false);
        }
    }, [user?.user_id]);

    // Load cart + wishlist when user logs in
    useEffect(() => {
        fetchCart();
        fetchWishlist();
    }, [fetchCart, fetchWishlist]);

    // ─── CART ACTIONS ────────────────────────────────────────────

    const addToCart = async (product, variant = null, size = null, qty = 1) => {
        if (!user?.user_id) {
            toast.error("Please login to add items to cart");
            return;
        }

        const productId = product?.product_id ?? product?.productId ?? product?.id;
        if (!productId || !Number.isInteger(Number(productId)) || Number(productId) < 1) {
            console.error("Add to cart skipped: product has no valid id", product);
            toast.error("Unable to add this product to cart");
            return;
        }

        const selectedVariant = variant || product.variants?.[0] || null;
        const selectedSize = size || selectedVariant?.selectedSizes?.[0] || "Free Size";
        const quantity = Number(qty);
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            toast.error("Enter a valid quantity");
            return;
        }

        const availableStock = getProductStock(product, selectedVariant, selectedSize);
        if (availableStock < 1) {
            toast.error("This product is out of stock");
            return;
        }
        if (quantity > availableStock) {
            toast.error(`Only ${availableStock} item${availableStock === 1 ? "" : "s"} available`);
            return;
        }
        const variantColor = selectedVariant?.colorName || selectedVariant?.color || "Default";

        try {
            await api.post("/cart", {
                product_id: Number(productId),
                variant_color: variantColor,
                variant_size: selectedSize,
                quantity,
            });
            toast.success("Product added to cart successfully");
            await fetchCart();
        } catch (err) {
            console.error("Add to cart error:", err);
            toast.error(err.response?.data?.message || "Failed to add to cart");
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            await api.delete(`/cart/${cartItemId}`);
            toast.success("Product removed from cart");
            await fetchCart();
        } catch (err) {
            console.error("Remove cart error:", err);
            toast.error("Failed to remove item");
        }
    };

    const updateCartQuantity = async (cartItemId, qty) => {
        if (qty < 1) return;
        const targetItem = cart.find(i => i.id === cartItemId);
        if (!targetItem) return;

        try {
            await api.put(`/cart/${cartItemId}`, { quantity: qty });
            await fetchCart();
        } catch (err) {
            console.error("Update qty error:", err);
            toast.error(err.response?.data?.message || "Failed to update quantity");
        }
    };

    const clearCart = async () => {
        if (!user?.user_id) { setCart([]); return; }
        try {
            await api.delete("/cart/clear");
            setCart([]);
            toast.success("Cart cleared");
        } catch (err) {
            console.error("Clear cart error:", err);
            toast.error(err.response?.data?.message || "Failed to clear cart");
        }
    };

    // ─── WISHLIST ACTIONS ────────────────────────────────────────

    const toggleWishlist = async (product, variant = null, size = null) => {
        if (!user?.user_id) {
            toast.error("Please login to manage wishlist");
            return;
        }

        const productId = product.product_id ?? product.productId ?? product.id;
        const isAlready = wishlist.some(w =>
            String(w.product_id ?? w.productId ?? w.id) === String(productId)
        );

        try {
            if (isAlready) {
                await api.delete(`/wishlist/${user.user_id}/${productId}`);
                toast.error("Removed from favorites");
            } else {
                const selectedVariant = variant || product.variants?.[0] || null;
                const selectedSize = size || selectedVariant?.selectedSizes?.[0] || "";
                const variantColor = selectedVariant?.colorName || selectedVariant?.color || "";
                
                // Correctly parse images if they are stored as JSON strings
                const variantImage = getFirstStoredImage(selectedVariant?.images) || getFirstStoredImage(product.images);
                
                const price = parseFloat(product.offer_price || product.price || 0);

                await api.post("/wishlist", {
                    user_id: user.user_id,
                    product_id: productId,
                    variant_color: variantColor,
                    variant_size: selectedSize,
                    image: variantImage,
                    email: user.email || "",
                    price: price,
                    total_price: price,
                });
                toast.success("Added to favorites!");
            }
            await fetchWishlist();
        } catch (err) {
            console.error("Toggle wishlist error:", err);
            toast.error("Failed to update wishlist");
        }
    };

    return (
        <StoreContext.Provider value={{
            cart, wishlist,
            addToCart, removeFromCart, updateCartQuantity, clearCart,
            toggleWishlist,
            loadingCart, loadingWishlist,
            fetchCart, fetchWishlist,
            productsCache, setProductsCache,
            videosCache, setVideosCache,
            bannersCache, setBannersCache,
            categoriesCache, setCategoriesCache,
            lastFetchTime, setLastFetchTime
        }}>
            {children}
        </StoreContext.Provider>
    );
};

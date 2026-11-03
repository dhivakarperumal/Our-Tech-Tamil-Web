import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
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

const parseStoredOptions = (options) => {
    if (Array.isArray(options)) return options;
    if (typeof options !== "string") return [];
    try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const StoreProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [cartOwnerId, setCartOwnerId] = useState(null);
    const cartFetchSequence = useRef(0);
    const cartOwner = useRef(null);
    const currentUserId = useRef(null);
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
        const userId = user?.user_id;
        if (!userId || currentUserId.current !== userId) return;
        const requestSequence = ++cartFetchSequence.current;
        try {
            setLoadingCart(true);
            const res = await api.get("/cart");
            const items = Array.isArray(res.data) ? res.data : res.data?.items;
            if (requestSequence === cartFetchSequence.current && currentUserId.current === userId) {
                cartOwner.current = userId;
                setCartOwnerId(userId);
                setCart((Array.isArray(items) ? items : []).map(item => ({
                    ...item,
                    name: item.product_name || item.name,
                    image: resolveStoredImage(item.product_image || item.image),
                    price: Number(item.offer_price ?? item.price ?? 0),
                    total_price: Number(item.subtotal ?? item.total_price ?? 0),
                })));
            }
        } catch (err) {
            if (requestSequence === cartFetchSequence.current && currentUserId.current === userId) {
                console.error("Fetch cart error:", err);
                toast.error(err.response?.data?.message || "Failed to load your cart");
            }
        } finally {
            if (requestSequence === cartFetchSequence.current && currentUserId.current === userId) {
                setLoadingCart(false);
            }
        }
    }, [user?.user_id]);

    useEffect(() => {
        currentUserId.current = user?.user_id;
        return () => {
            cartFetchSequence.current += 1;
        };
    }, [user?.user_id]);

    // ─── Fetch wishlist from backend ─────────────────────────────
    const fetchWishlist = useCallback(async () => {
        if (!user?.user_id) {
            setWishlist([]);
            setLoadingWishlist(false);
            return;
        }
        try {
            setLoadingWishlist(true);
            const res = await api.get("/wishlist");
            setWishlist(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Fetch wishlist error:", err);
            toast.error(err.response?.data?.message || "Failed to load favorites");
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
            return false;
        }

        const productId = product?.product_id ?? product?.productId ?? product?.id;
        if (!productId || !Number.isInteger(Number(productId)) || Number(productId) < 1) {
            console.error("Add to cart skipped: product has no valid id", product);
            toast.error("Unable to add this product to cart");
            return false;
        }

        const selectedVariant = variant || product.variants?.[0] || null;
        const selectedSize = size || selectedVariant?.selectedSizes?.[0] || "Free Size";
        const quantity = Number(qty);
        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            toast.error("Enter a valid quantity");
            return false;
        }

        const availableStock = getProductStock(product, selectedVariant, selectedSize);
        if (availableStock < 1) {
            toast.error("This product is out of stock");
            return false;
        }
        if (quantity > availableStock) {
            toast.error(`Only ${availableStock} item${availableStock === 1 ? "" : "s"} available`);
            return false;
        }
        const variantColor = selectedVariant?.colorName || selectedVariant?.color || "";

        try {
            await api.post("/cart", {
                product_id: Number(productId),
                variant_color: variantColor,
                variant_size: selectedSize,
                quantity,
            });
            toast.success("Product added to cart successfully");
            await fetchCart();
            return true;
        } catch (err) {
            console.error("Add to cart error:", err);
            toast.error(err.response?.data?.message || "Failed to add to cart");
            return false;
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
        const userId = user?.user_id;
        if (!userId) return;
        try {
            await api.delete("/cart/clear");
            if (currentUserId.current === userId && cartOwner.current === userId) setCart([]);
            toast.success("Cart cleared");
        } catch (err) {
            console.error("Clear cart error:", err);
            toast.error(err.response?.data?.message || "Failed to clear cart");
        }
    };

    // ─── WISHLIST ACTIONS ────────────────────────────────────────

    const toggleWishlist = async (product) => {
        if (!user?.user_id) {
            toast.error("Please login to manage wishlist");
            return;
        }

        const productId = product.product_id ?? product.productId ?? product.id;
        let variants = product.variants;
        if (typeof variants === "string") {
            try {
                variants = JSON.parse(variants);
            } catch {
                variants = [];
            }
        }
        const selectedVariant = Array.isArray(variants)
            ? variants.find((variant) =>
                (variant.colorName || variant.color || "") === (product.variant_color || product.colorName),
            ) || variants[0]
            : null;
        const availableColors = parseStoredOptions(product.available_colors);
        const availableSizes = parseStoredOptions(product.available_sizes);
        const variantColor = product.variant_color || product.colorName ||
            selectedVariant?.colorName || selectedVariant?.color || availableColors[0] || "";
        const variantSize = product.variant_size || product.size ||
            selectedVariant?.selectedSizes?.[0] ||
            (selectedVariant?.sizesStock ? Object.keys(selectedVariant.sizesStock)[0] : "") ||
            availableSizes[0] || "";
        const isAlready = wishlist.some(w =>
            String(w.product_id ?? w.productId ?? w.id) === String(productId) &&
            (w.variant_color || w.colorName || "") === variantColor &&
            (w.variant_size || w.size || "") === variantSize
        );

        try {
            if (isAlready) {
                await api.delete(`/wishlist/${productId}`, {
                    params: { variant_color: variantColor, variant_size: variantSize },
                });
                toast.success("Removed from favorites");
            } else {
                await api.post("/wishlist", {
                    product_id: Number(productId),
                    variant_color: variantColor,
                    variant_size: variantSize,
                });
                toast.success("Added to favorites!");
            }
            await fetchWishlist();
        } catch (err) {
            console.error("Toggle wishlist error:", err);
            toast.error(err.response?.data?.message || "Failed to update favorites");
        }
    };

    const visibleCart = cartOwnerId === user?.user_id ? cart : [];

    return (
        <StoreContext.Provider value={{
            cart: visibleCart, wishlist,
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

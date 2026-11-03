import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import { StoreProvider } from "./PrivateRouter/StoreContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { AdminProvider } from "./PrivateRouter/AdminContext.jsx";
import { Toaster } from "react-hot-toast";
import Loader from "./Components/CommenComponents/Loader.jsx";

// Lazy Load Main Components
const Home = React.lazy(() => import("./Components/Home/Home.jsx"));
const Shop = React.lazy(() => import("./Components/Shop/Shop.jsx"));
const PublicProductDetails = React.lazy(() => import("./Components/Products/ProductDetails.jsx"));
const Cart = React.lazy(() => import("./Components/Products/Cart.jsx"));
const Checkout = React.lazy(() => import("./Components/Products/Checkout.jsx"));

const Login = React.lazy(() => import("./Components/Auth/Login.jsx"));
const Register = React.lazy(() => import("./Components/Auth/Register.jsx"));

// Lazy Load Admin Components
const AdminPanel = React.lazy(() => import("./Admin/AdminPanel.jsx"));
const Dashboard = React.lazy(() => import("./Admin/Dashboard.jsx"));
const AdminProfile = React.lazy(() => import("./Admin/Settings/Profile.jsx"));
const AdminCategories = React.lazy(() => import("./Admin/Categories/Category.jsx"));
const AdminUsers = React.lazy(() => import("./Admin/Customers/Users.jsx"));
const AdminBanners = React.lazy(() => import("./Admin/Banners/Banners.jsx"));
const AllProducts = React.lazy(() => import("./Admin/Products/AllProducts.jsx"));
const AddProducts = React.lazy(() => import("./Admin/Products/AddProducts.jsx"));
const ProductDetail = React.lazy(() => import("./Admin/Products/ProductDetail.jsx"));
const StockDetails = React.lazy(() => import("./Admin/Stocks/StockDetails.jsx"));
const AddStock = React.lazy(() => import("./Admin/Stocks/AddStock.jsx"));
const AdminServices = React.lazy(() => import("./Admin/Services/Services.jsx"));
const AdminArticles = React.lazy(() => import("./Admin/Articles/Articles.jsx"));
const AdminYoutubeVideos = React.lazy(() => import("./Admin/YoutubeVideos/YoutubeVideos.jsx"));
const AdminReviews = React.lazy(() => import("./Admin/Reviews/Reviews.jsx"));
const AdminBilling = React.lazy(() => import("./Admin/Billings/Billing.jsx"));
const CreateShopOrder = React.lazy(() => import("./Admin/Billings/CreateOrder.jsx"));
const AdminOrders = React.lazy(() => import("./Admin/Orders/Orders.jsx"));
const AdminOrderDetail = React.lazy(() => import("./Admin/Orders/OrderDetail.jsx"));

const ErrorPage = React.lazy(() => import("./Admin/Pages/ErrorPage.jsx"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "product/:id", element: <PublicProductDetails /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      

    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminProvider>
          <AdminPanel />
        </AdminProvider>
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "profile", element: <AdminProfile /> },
      { path: "products/all", element: <AllProducts /> },
      { path: "products/add", element: <AddProducts /> },
      { path: "products/edit/:id", element: <AddProducts /> },
      { path: "products/category", element: <AdminCategories /> },
      { path: "products/stock", element: <StockDetails /> },
      { path: "products/stock/add", element: <AddStock /> },
      { path: "products/:id", element: <ProductDetail /> },
      { path: "users/all", element: <AdminUsers /> },
      { path: "banners", element: <AdminBanners /> },
      { path: "service", element: <AdminServices /> },
      { path: "articles", element: <AdminArticles /> },
      { path: "youtube-videos", element: <AdminYoutubeVideos /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "orders/all", element: <AdminOrders statusFilter="All" /> },
      { path: "orders/new", element: <AdminOrders statusFilter="Order Placed" /> },
      { path: "orders/delivery", element: <AdminOrders statusFilter="Shipping" /> },
      { path: "orders/cancelled", element: <AdminOrders statusFilter="Cancelled" /> },
      { path: "orders/billing", element: <AdminBilling /> },
      { path: "orders/shop-create", element: <CreateShopOrder /> },
      { path: "orders/:id", element: <AdminOrderDetail /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <StoreProvider>
        <Toaster position="top-left" reverseOrder={false} />
        <React.Suspense fallback={<Loader />}>
          <RouterProvider router={router} />
        </React.Suspense>
      </StoreProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

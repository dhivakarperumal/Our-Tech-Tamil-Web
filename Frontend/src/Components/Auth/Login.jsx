import { useState, useContext, useEffect } from "react";
import api from "../../api";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import {
  ArrowRight,
  Award,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(360);
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  useEffect(() => {
    const updateButtonWidth = () => {
      setGoogleButtonWidth(
        Math.max(200, Math.min(360, window.innerWidth - 80)),
      );
    };

    updateButtonWidth();
    window.addEventListener("resize", updateButtonWidth);
    return () => window.removeEventListener("resize", updateButtonWidth);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.token);
      toast.success("Login successful!");
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google-login", {
        credential: credentialResponse.credential,
      });
      login(res.data.user, res.data.token);
      toast.success("Google Login Successful!");
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(
        error.response?.data?.message || error.message || "Google Login Failed",
      );
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-surface to-secondary-light/20 font-sans text-text-primary selection:bg-primary selection:text-surface lg:grid lg:h-screen lg:min-h-[680px] lg:grid-cols-2 lg:bg-secondary-dark">
      <img
        src="/images/loginbanner.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-center lg:block"
      />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-secondary-dark/10 via-transparent to-secondary-dark/10 lg:block" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:min-h-0 lg:justify-start lg:px-0 lg:py-0">
        <div className="w-full max-w-[460px] rounded-[30px] border border-surface/80 bg-surface/95 px-6 py-7 shadow-[0_24px_80px_rgba(40,0,120,0.2)] backdrop-blur-xl sm:px-10 sm:py-8 lg:ml-[5.7vw] lg:px-9 lg:py-7">
          <div className="mb-6 text-center lg:mb-7">
            <img
              src="/images/logo1.png"
              alt="Our Tech Tamil logo"
              className="mx-auto mb-1 h-11 w-11 object-contain"
            />
            <p className="text-[26px] font-extrabold leading-none tracking-tight text-text-primary">
              Our Tech <span className="text-gradient-middle">Tamil</span>
            </p>
            <div className="mx-auto mt-2 flex max-w-[290px] items-center gap-3">
              <span className="h-px flex-1 bg-primary-light/70" />
              <p className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.32em] text-secondary-dark">
                Gadgets &amp; Electronics
              </p>
              <span className="h-px flex-1 bg-primary-light/70" />
            </div>
            <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-text-primary">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to your account to continue shopping
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[18px]">
            <label className="relative block">
              <span className="sr-only">Email or phone number</span>
              <UserRound
                size={20}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                name="identifier"
                type="text"
                placeholder="Email or Phone Number"
                autoComplete="username"
                value={form.identifier}
                onChange={handleChange}
                className="w-full rounded-2xl border border-secondary-light/40 bg-surface/80 py-3.5 pl-12 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary-light focus:ring-4 focus:ring-primary/10 lg:py-4"
                required
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Password</span>
              <LockKeyhole
                size={20}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-secondary-light/40 bg-surface/80 py-3.5 pl-12 pr-12 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary-light focus:ring-4 focus:ring-primary/10 lg:py-4"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-primary"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </label>

            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-text-secondary">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Remember me
              </label>
              <a
                href="#"
                className="font-semibold text-primary transition hover:text-primary-light hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary-dark via-primary to-gradient-middle py-3.5 font-bold text-surface shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 lg:py-4"
            >
              {submitting ? "Signing In..." : "Sign In"}
              {!submitting && (
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>

            <div className="flex items-center gap-4 py-0.5">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-secondary-light/50 to-secondary-light/50" />
              <span className="text-xs font-medium text-text-secondary">
                or continue with
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-secondary-light/50 to-secondary-light/50" />
            </div>

            <div className="flex w-full justify-center [&>div]:w-full [&>div]:!max-w-full [&>div]:!justify-center">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() =>
                  toast.error("Google sign-in could not be completed.")
                }
                type="standard"
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
                width={String(googleButtonWidth)}
                logo_alignment="center"
              />
            </div>

            <p className="pt-1 text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-primary underline-offset-4 transition hover:text-primary-light hover:underline"
              >
                Register Now
              </Link>
            </p>
          </form>
        </div>
      </section>

      <aside className="relative z-10 hidden min-h-screen overflow-hidden lg:block">
        <div className="mx-auto max-w-[600px] px-8 pt-[10vh] text-center">
          <h2 className="text-4xl font-black italic leading-[1.08] text-surface xl:text-5xl">
            Upgrade Your
            <br />
            <span className="bg-gradient-to-r from-surface via-secondary-light to-accent bg-clip-text text-transparent">
              Tech Lifestyle
            </span>
          </h2>
          <div className="mx-auto my-4 h-1 w-20 rounded-full bg-gradient-to-r from-secondary-light to-gradient-middle" />
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-surface/90 xl:text-base">
            Discover the latest gadgets, laptops, accessories and more at great
            prices.
          </p>

          <div className="mx-auto mt-7 flex max-w-md items-center justify-center">
            <div className="flex flex-1 flex-col items-center gap-1.5 text-surface">
              <Truck size={30} strokeWidth={1.7} />
              <span className="text-xs font-medium">Fast Delivery</span>
            </div>
            <span className="h-12 w-px bg-surface/20" />
            <div className="flex flex-1 flex-col items-center gap-1.5 text-surface">
              <ShieldCheck size={30} strokeWidth={1.7} />
              <span className="text-xs font-medium">Secure Payments</span>
            </div>
            <span className="h-12 w-px bg-surface/20" />
            <div className="flex flex-1 flex-col items-center gap-1.5 text-surface">
              <Award size={30} strokeWidth={1.7} />
              <span className="text-xs font-medium">Trusted Quality</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

export default Login;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  House,
  LockKeyhole,
  Mail,
  Phone,
  Smartphone,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import api from "../../api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (form.password.length < 8 || form.password.length > 72) {
      return toast.error("Password must be between 8 and 72 characters");
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-secondary-light/40 bg-surface/80 py-3 pl-11 pr-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary-light focus:ring-4 focus:ring-primary/10";
  const labelClassName = "sr-only";
  const iconClassName =
    "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary";

  return (
    <main className="relative h-dvh overflow-hidden bg-gradient-to-br from-primary-dark via-secondary-dark to-gradient-end font-sans text-text-primary selection:bg-primary selection:text-surface lg:grid lg:grid-cols-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 -top-48 hidden h-[470px] w-[470px] rounded-full border-[18px] border-primary-light/70 bg-secondary-light lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[330px] -left-[210px] hidden h-[470px] w-[650px] rotate-[-18deg] rounded-[50%] border-t-[22px] border-gradient-middle bg-gradient-to-r from-secondary-light via-primary to-secondary-dark lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-52 bottom-[12%] hidden h-[500px] w-[700px] rounded-full border-2 border-secondary-light/40 bg-gradient-to-br from-gradient-middle/50 via-primary/30 to-secondary-dark/20 lg:block"
      />

      <section className="relative z-10 flex h-full min-h-0 items-center justify-center px-4 py-3 sm:px-8 sm:py-4 lg:justify-start lg:px-0 lg:py-0">
        <div data-aos="fade-up" className="max-h-[calc(100dvh-24px)] w-full max-w-[460px] overflow-y-auto rounded-[30px] border border-surface/80 bg-surface/95 px-6 py-4 shadow-[0_24px_80px_rgba(40,0,120,0.2)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-9 sm:py-6 lg:ml-[5.7vw] lg:h-[min(680px,calc(100dvh-24px))]">
          <div className="mb-2 flex justify-start">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-primary transition hover:bg-primary/5 hover:text-primary-light">
              <House size={16} aria-hidden="true" />
              Go to Home
            </Link>
          </div>
          <header className="mb-4 text-center">
            <img
              src="/images/logo.jpeg"
              alt="Our Tech Tamil logo"
              className="mx-auto mb-1 h-10 w-10 object-contain mix-blend-multiply"
            />
            <p className="text-[25px] font-extrabold leading-none tracking-tight text-text-primary">
              Our Tech <span className="text-gradient-middle">Tamil</span>
            </p>
            <div className="mx-auto mt-2 flex max-w-[290px] items-center gap-3">
              <span className="h-px flex-1 bg-primary-light/70" />
              <p className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.32em] text-secondary-dark">
                Gadgets &amp; Electronics
              </p>
              <span className="h-px flex-1 bg-primary-light/70" />
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-text-primary">
              Join Our <span className="text-primary">Tech World</span>
            </h1>
            {/* <p className="mt-1 text-sm text-text-secondary">
              Create an account and find your next favorite gadget
            </p> */}
          </header>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <label htmlFor="register-username" className={labelClassName}>
              Full name
            </label>
            <div className="relative">
              <UserRound size={19} className={iconClassName} aria-hidden="true" />
              <input
                id="register-username"
                name="username"
                type="text"
                placeholder="Full Name"
                autoComplete="name"
                value={form.username}
                onChange={handleChange}
                className={inputClassName}
                required
              />
            </div>

            <label htmlFor="register-email" className={labelClassName}>
              Email address
            </label>
            <div className="relative">
              <Mail size={19} className={iconClassName} aria-hidden="true" />
              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className={inputClassName}
                required
              />
            </div>

            <label htmlFor="register-phone" className={labelClassName}>
              Mobile number
            </label>
            <div className="relative">
              <Phone size={19} className={iconClassName} aria-hidden="true" />
              <input
                id="register-phone"
                name="phone"
                type="tel"
                placeholder="Mobile Number"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                className={inputClassName}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label htmlFor="register-password" className={labelClassName}>
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className={iconClassName}
                    aria-hidden="true"
                  />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    className={`${inputClassName} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className={labelClassName}
                >
                  Confirm password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className={iconClassName}
                    aria-hidden="true"
                  />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`${inputClassName} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-primary"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-dark via-primary to-gradient-middle py-3 font-bold text-surface shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Setting Up Your Account..." : "Create My Account"}
              {!submitting && (
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>

            <p className="pt-1 text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-primary underline-offset-4 transition hover:text-primary-light hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </section>

      <aside className="relative z-10 hidden h-full min-h-0 overflow-hidden lg:block">
        <img
          src="/images/loginimage.png"
          alt="Laptop, headphones, smartphone and other technology products"
          className="login-promo-art pointer-events-none absolute bottom-0 right-0 z-0 h-[48vh] w-full object-cover object-[72%_center]"
        />
        <div className="login-promo-content relative z-10 mx-auto max-w-[600px] px-8 text-center">
          <h2 className="text-4xl font-black italic leading-[1.08] text-surface xl:text-5xl">
            Discover Your
            <br />
            <span className="bg-gradient-to-r from-surface via-secondary-light to-accent bg-clip-text text-transparent">
              Next Tech Upgrade
            </span>
          </h2>
          <div className="mx-auto my-4 h-1 w-20 rounded-full bg-gradient-to-r from-secondary-light to-gradient-middle" />
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-surface/90 xl:text-base">
            Sign up to explore the latest gadgets, compare your favorites, and
            shop trusted tech with confidence.
          </p>

          <div className="mx-auto mt-7 flex max-w-md items-center justify-center">
            <div className="flex flex-1 flex-col items-center gap-1.5 text-surface">
              <Smartphone size={30} strokeWidth={1.7} />
              <span className="text-xs font-medium">Latest Gadgets</span>
            </div>
            <span className="h-12 w-px bg-surface/20" />
            <div className="flex flex-1 flex-col items-center gap-1.5 text-surface">
              <ShieldCheck size={30} strokeWidth={1.7} />
              <span className="text-xs font-medium">Secure Checkout</span>
            </div>
            <span className="h-12 w-px bg-surface/20" />
            <div className="flex flex-1 flex-col items-center gap-1.5 text-surface">
              <Truck size={30} strokeWidth={1.7} />
              <span className="text-xs font-medium">Fast Delivery</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

export default Register;

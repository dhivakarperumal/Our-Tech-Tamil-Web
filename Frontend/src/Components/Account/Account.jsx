import { useContext } from "react";
import { Link } from "react-router-dom";
import { Mail, Package, Phone, ShoppingBag, UserRound } from "lucide-react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

function Account() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <PageHeader title="My Account" />
      <main className="bg-[#faf9fc] py-8 sm:py-12">
        <PageContainer>
          {user ? (
            <section className="mx-auto max-w-3xl rounded-2xl border border-[#e9def5] bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f3eaff] text-primary">
                  <UserRound size={27} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-extrabold text-text-primary">
                    {user.username || user.name || "Welcome"}
                  </h2>
                  <p className="text-sm text-text-secondary">Your account</p>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-[#faf9fc] p-4">
                  <Mail size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-text-secondary">Email</dt>
                    <dd className="mt-1 break-all text-sm font-medium text-text-primary">{user.email || "Not provided"}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-[#faf9fc] p-4">
                  <Phone size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold text-text-secondary">Phone</dt>
                    <dd className="mt-1 text-sm font-medium text-text-primary">{user.phone || "Not provided"}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                >
                  <ShoppingBag size={17} aria-hidden="true" /> Browse products
                </Link>
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5"
                >
                  <Package size={17} aria-hidden="true" /> View cart
                </Link>
              </div>
            </section>
          ) : (
            <section className="mx-auto max-w-xl rounded-2xl border border-[#e9def5] bg-white p-8 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3eaff] text-primary">
                <UserRound size={27} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Sign in to your account</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Sign in to view your account details and shopping options.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                Sign in
              </Link>
            </section>
          )}
        </PageContainer>
      </main>
    </>
  );
}

export default Account;

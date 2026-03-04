import loginImage from "../../../core/assets/images/login/login.png";
import useLogin from "../hooks/useLogin";

const LoginView = () => {
  const { formData, isLoading, error, handleChange, handleSubmit } = useLogin();

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ede9fe_0%,#e0e7ff_45%,#f8fafc_100%)] p-4 md:p-6">
      <section className="mx-auto flex h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl">
        <div className="flex w-full items-center bg-[#f8f6ff] p-5 md:p-6 lg:w-[40%]">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              Welcome Back
            </p>
            <h1 className="text-3xl font-serif text-slate-900">
              Power Your Storefront
            </h1>
            <p className="text-sm text-slate-600">
              Sign in with your account. You will be redirected to the Admin or
              Client portal based on your role.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full cursor-pointer rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition hover:brightness-105"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="text-xs leading-relaxed text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <div className="relative hidden flex-1 lg:block">
          <img
            src={loginImage}
            alt="Ecommerce login illustration"
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </main>
  );
};

export default LoginView;

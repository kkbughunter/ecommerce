import loginImage from "../../../core/assets/images/login/login.png";
import AppFooter from "../../../layouts/AppFooter";
import useLogin from "../hooks/useLogin";

const LoginView = () => {
  const {
    mode,
    loginForm,
    registerForm,
    verifyForm,
    isLoading,
    error,
    success,
    switchMode,
    handleLoginChange,
    handleRegisterChange,
    handleVerifyChange,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleVerifySubmit,
    handleResendOtp,
  } = useLogin();

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_20%,#ede9fe_0%,#e0e7ff_45%,#f8fafc_100%)] p-4 md:p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl">
        <div className="flex w-full items-center bg-[#f8f6ff] p-5 md:p-6 lg:w-[40%]">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              {mode === "login" && "Welcome Back"}
              {mode === "register" && "Create Account"}
              {mode === "verify" && "Verify Account"}
            </p>
            <h1 className="text-3xl font-serif text-slate-900">
              Power Your Storefront
            </h1>
            <p className="text-sm text-slate-600">
              {mode === "login"
                ? "Sign in with your account. You will be redirected to the Admin, Super Admin, or Client portal based on your role."
                : mode === "register"
                  ? "Register with your email. We will send an OTP to verify your account."
                  : "Enter your email and OTP sent to your inbox."}
            </p>

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
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
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Enter password"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-600">{success}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full cursor-pointer rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </form>
            ) : mode === "register" ? (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={registerForm.firstName}
                    onChange={handleRegisterChange}
                    placeholder="Enter first name"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={registerForm.lastName}
                    onChange={handleRegisterChange}
                    placeholder="Enter last name"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
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
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="Enter password (8-32 chars)"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    minLength={8}
                    maxLength={32}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-600">{success}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full cursor-pointer rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifySubmit}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={verifyForm.email}
                    readOnly
                    disabled
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={verifyForm.otp}
                    onChange={handleVerifyChange}
                    placeholder="Enter 6-digit OTP"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-600">{success}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full cursor-pointer rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="h-11 w-full cursor-pointer rounded-lg border border-violet-200 bg-white text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Please wait..." : "Resend OTP"}
                </button>
              </form>
            )}

            <p className="text-xs leading-relaxed text-slate-500 pt-1">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>

            {mode === "login" ? (
              <p className="text-center text-sm text-slate-600">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-violet-700 hover:text-violet-800 cursor-pointer"
                >
                  Create account
                </button>
              </p>
            ) : mode === "register" ? (
              <p className="text-center text-sm text-slate-600">
                Already registered and verified?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-violet-700 hover:text-violet-800 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-slate-600">
                Back to{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-violet-700 hover:text-violet-800 cursor-pointer"
                >
                  Sign in
                </button>
                {" "}or{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-violet-700 hover:text-violet-800 cursor-pointer"
                >
                  Create account
                </button>
              </p>
            )}
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
      <AppFooter />
    </main>
  );
};

export default LoginView;

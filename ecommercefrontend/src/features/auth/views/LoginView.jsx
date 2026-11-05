import { useState } from "react";
import { Link } from "react-router-dom";
import ClientTopNav from "../../client/components/ClientTopNav";
import StoreFooter from "../../client/components/StoreFooter";
import StoreIcon from "../../client/components/StoreIcon";

import useLogin from "../hooks/useLogin";

const PasswordVisibilityIcon = ({ visible }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5"
  >
    {visible ? (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ) : (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M6.4 6.4C3.9 8.1 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3.5-.7" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    )}
  </svg>
);

const PasswordInput = ({ visible, onToggle, label, ...inputProps }) => (
  <div>
    <label
      htmlFor={inputProps.name}
      className="mb-1 block text-sm font-medium text-slate-700"
    >
      {label}
    </label>
    <div className="relative">
      <input
        {...inputProps}
        id={inputProps.name}
        type={visible ? "text" : "password"}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500"
      >
        <PasswordVisibilityIcon visible={visible} />
      </button>
    </div>
  </div>
);

const LoginView = () => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    login: false,
    register: false,
    confirm: false,
  });
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
    <main className="storefront">
      <ClientTopNav />
      <div className="store-container">
        <section id="main-content" tabIndex="-1" className="store-auth-section">
          <div className="store-auth-form">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                {mode === "login" && "Welcome Back"}
                {mode === "register" && "Create Account"}
                {mode === "verify" && "Verify Account"}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {mode === "login"
                  ? "Good to see you again."
                  : mode === "register"
                    ? "Let’s start building."
                    : "Check your inbox."}
              </h1>
              <p className="text-sm text-slate-600">
                {mode === "login"
                  ? "Sign in to save your components, manage your orders and keep your next project moving."
                  : mode === "register"
                    ? "Register with your email. We will send an OTP to verify your account."
                    : "Enter your email and OTP sent to your inbox."}
              </p>

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="Enter your email"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      required
                    />
                  </div>

                  <PasswordInput
                    label="Password"
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Enter password"
                    visible={passwordVisibility.login}
                    onToggle={() =>
                      setPasswordVisibility((prev) => ({
                        ...prev,
                        login: !prev.login,
                      }))
                    }
                    required
                  />

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {success && (
                    <p className="text-sm text-emerald-600">{success}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full cursor-pointer rounded-lg bg-violet-600 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                </form>
              ) : mode === "register" ? (
                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
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
                    <label
                      htmlFor="lastName"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={registerForm.lastName}
                      onChange={handleRegisterChange}
                      placeholder="Enter last name"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      placeholder="Enter your email"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      required
                    />
                  </div>

                  <PasswordInput
                    label="Password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="Enter password (8-32 chars)"
                    visible={passwordVisibility.register}
                    onToggle={() =>
                      setPasswordVisibility((prev) => ({
                        ...prev,
                        register: !prev.register,
                      }))
                    }
                    minLength={8}
                    maxLength={32}
                    required
                  />

                  <PasswordInput
                    label="Confirm Password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Re-enter your password"
                    visible={passwordVisibility.confirm}
                    onToggle={() =>
                      setPasswordVisibility((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    minLength={8}
                    maxLength={32}
                    required
                  />

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {success && (
                    <p className="text-sm text-emerald-600">{success}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full cursor-pointer rounded-lg bg-violet-600 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleVerifySubmit}>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
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
                    <label
                      htmlFor="otp"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      OTP
                    </label>
                    <input
                      id="otp"
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
                  {success && (
                    <p className="text-sm text-emerald-600">{success}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full cursor-pointer rounded-lg bg-violet-600 text-sm font-semibold text-white transition hover:brightness-105"
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
                By continuing, you agree to our{" "}
                <Link to="/legal/terms" className="underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link to="/legal/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
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
                  </button>{" "}
                  or{" "}
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

          <div className="store-auth-art">
            <StoreIcon name="chip" />
            <p className="store-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</p>
            <h2>
              Big ideas.
              <br />
              Small components.
              <br />
              Endless possibilities.
            </h2>
            <p>
              Your next project is one good idea away. We are here for all the
              parts in between.
            </p>
          </div>
        </section>
      </div>
      <StoreFooter />
    </main>
  );
};

export default LoginView;

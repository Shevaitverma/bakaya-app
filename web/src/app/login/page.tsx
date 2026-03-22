"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { authApi } from "@/lib/api/auth";
import { ApiError, setToken, setRefreshToken } from "@/lib/api-client";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    server?: string;
  }>({});

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isLoading) return;

    setIsGoogleLoading(true);
    setErrors({});

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const { user, accessToken, refreshToken } = await authApi.googleLogin({
        credential: idToken,
      });
      setToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem("bakaya_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ server: error.message });
      } else if ((error as { code?: string })?.code === "auth/popup-closed-by-user") {
        // User closed the popup, no error needed
      } else {
        setErrors({ server: "Google sign-in failed. Please try again." });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      setToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem("bakaya_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ server: error.message });
      } else {
        setErrors({
          server: "Unable to connect to server. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>B</span>
            Bakaya
          </Link>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to continue to your account
          </p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {errors.server && (
            <div className={styles.serverError}>{errors.server}</div>
          )}

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              autoComplete="email"
              autoCapitalize="none"
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                autoComplete="current-password"
                style={{ paddingRight: "48px" }}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "\uD83D\uDE48" : "\uD83D\uDC41"}
              </button>
            </div>
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? <span className={styles.spinner} /> : "Sign In"}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <span className={styles.spinnerDark} />
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerText}>Don&apos;t have an account?</span>
          <Link href="/register" className={styles.footerLink}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { authApi } from "@/lib/api/auth";
import { ApiError, setToken, setRefreshToken } from "@/lib/api-client";
import styles from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    server?: string;
  }>({});

  const handleGoogleSignUp = async () => {
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
        setErrors({ server: "Google sign-up failed. Please try again." });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Password strength requirements
  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    }),
    [password]
  );

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (/\s/.test(username)) {
      newErrors.username = "Username cannot contain spaces";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else {
      const missing: string[] = [];
      if (!passwordChecks.length) missing.push("at least 8 characters");
      if (!passwordChecks.lowercase) missing.push("one lowercase letter");
      if (!passwordChecks.uppercase) missing.push("one uppercase letter");
      if (!passwordChecks.number) missing.push("one number");
      if (missing.length > 0) {
        newErrors.password = `Password must contain ${missing.join(", ")}`;
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      await authApi.register({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim() || undefined,
      });
      router.push("/login");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.message.includes("Email already exists")) {
          setErrors({ email: "This email is already registered" });
        } else if (error.code === "VALIDATION_ERROR") {
          setErrors({ server: "Please check your input and try again." });
        } else {
          setErrors({ server: error.message });
        }
      } else {
        setErrors({
          server: "Unable to connect to server. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>
            Sign up to get started with Bakaya
          </p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {errors.server && (
            <div className={styles.serverError}>{errors.server}</div>
          )}

          {/* Name Row */}
          <div className={styles.nameRow}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                placeholder="John"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError("firstName");
                }}
                autoCapitalize="words"
              />
              {errors.firstName && (
                <span className={styles.errorText}>{errors.firstName}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                placeholder="Doe"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError("lastName");
                }}
                autoCapitalize="words"
              />
              {errors.lastName && (
                <span className={styles.errorText}>{errors.lastName}</span>
              )}
            </div>
          </div>

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
                clearFieldError("email");
              }}
              autoComplete="email"
              autoCapitalize="none"
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </div>

          {/* Username */}
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
              placeholder="Choose a username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              autoCapitalize="none"
              autoCorrect="off"
            />
            {errors.username && (
              <span className={styles.errorText}>{errors.username}</span>
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                autoComplete="new-password"
                autoCapitalize="none"
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

            {/* Password Requirements */}
            {password.length > 0 && (
              <div className={styles.passwordRequirements}>
                <span
                  className={`${styles.requirement} ${passwordChecks.length ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.length ? "\u2713" : "\u25CB"}
                  </span>
                  8+ characters
                </span>
                <span
                  className={`${styles.requirement} ${passwordChecks.lowercase ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.lowercase ? "\u2713" : "\u25CB"}
                  </span>
                  Lowercase
                </span>
                <span
                  className={`${styles.requirement} ${passwordChecks.uppercase ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.uppercase ? "\u2713" : "\u25CB"}
                  </span>
                  Uppercase
                </span>
                <span
                  className={`${styles.requirement} ${passwordChecks.number ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.number ? "\u2713" : "\u25CB"}
                  </span>
                  Number
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                autoComplete="new-password"
                autoCapitalize="none"
                style={{ paddingRight: "48px" }}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "\uD83D\uDE48" : "\uD83D\uDC41"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className={styles.errorText}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              "Create Account"
            )}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Google Sign-Up */}
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignUp}
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
                Sign up with Google
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerText}>Already have an account?</span>
          <Link href="/login" className={styles.footerLink}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

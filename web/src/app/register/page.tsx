"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
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
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    server?: string;
  }>({});

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
                {showPassword ? "🙈" : "👁"}
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
                    {passwordChecks.length ? "✓" : "○"}
                  </span>
                  8+ characters
                </span>
                <span
                  className={`${styles.requirement} ${passwordChecks.lowercase ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.lowercase ? "✓" : "○"}
                  </span>
                  Lowercase
                </span>
                <span
                  className={`${styles.requirement} ${passwordChecks.uppercase ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.uppercase ? "✓" : "○"}
                  </span>
                  Uppercase
                </span>
                <span
                  className={`${styles.requirement} ${passwordChecks.number ? styles.requirementMet : ""}`}
                >
                  <span className={styles.requirementIcon}>
                    {passwordChecks.number ? "✓" : "○"}
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
                {showConfirmPassword ? "🙈" : "👁"}
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

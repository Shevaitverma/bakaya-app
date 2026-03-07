import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>B</span>
          Bakaya
        </div>
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.btnLogin}>
            Login
          </Link>
          <Link href="/register" className={styles.btnRegister}>
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Manage Your Expenses,
            <br />
            Effortlessly
          </h1>
          <p className={styles.heroSubtitle}>
            Track spending, split bills with friends, and stay on top of your
            finances — all in one place.
          </p>
          <Link href="/register" className={styles.heroCta}>
            Get Started Free &rarr;
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>Everything You Need</h2>
          <p className={styles.featuresSubtitle}>
            Simple yet powerful tools to keep your finances organized.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Feature 1 */}
          <div className={styles.featureCard}>
            <div
              className={`${styles.featureIcon} ${styles.featureIconPrimary}`}
            >
              <span role="img" aria-label="receipt">
                🧾
              </span>
            </div>
            <h3 className={styles.featureTitle}>Track Expenses</h3>
            <p className={styles.featureDescription}>
              Log every expense with categories, notes, and amounts. See exactly
              where your money goes each month.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
              <span role="img" aria-label="group">
                👥
              </span>
            </div>
            <h3 className={styles.featureTitle}>Group Splitting</h3>
            <p className={styles.featureDescription}>
              Create groups, add shared expenses, and automatically calculate
              who owes what. Perfect for trips and roommates.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className={styles.featureCard}
          >
            <div
              className={`${styles.featureIcon} ${styles.featureIconSuccess}`}
            >
              <span role="img" aria-label="categories">
                📊
              </span>
            </div>
            <h3 className={styles.featureTitle}>Smart Categories</h3>
            <p className={styles.featureDescription}>
              Organize expenses into 17 categories — from food and transport to
              healthcare and entertainment.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          &copy; {new Date().getFullYear()} Bakaya. All rights reserved.
        </p>
      </footer>
    </>
  );
}

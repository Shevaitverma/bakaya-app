"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("bakaya_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <>
      {/* Sticky Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>B</span>
            Bakaya
          </div>
          <nav className={styles.headerNav}>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#how-it-works" className={styles.navLink}>
              How It Works
            </a>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/login" className={styles.btnLogin}>
              Login
            </Link>
            <Link href="/register" className={styles.btnGetStarted}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Personal Finance Tracker</span>
          <h1 className={styles.heroTitle}>
            Track Every Rupee,
            <br />
            Know Where It Goes
          </h1>
          <p className={styles.heroSubtitle}>
            Tag expenses to people in your life. Split bills with groups. See
            exactly how much you spend on everyone.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className={styles.heroCtaPrimary}>
              Get Started Free <span aria-hidden="true">&rarr;</span>
            </Link>
            <a href="#how-it-works" className={styles.heroCtaSecondary}>
              See How It Works
            </a>
          </div>
          <p className={styles.heroTrust}>
            No credit card required &bull; Free forever
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Everything you need to manage your money
            </h2>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div
                className={`${styles.featureIconWrap} ${styles.featureIconPink}`}
              >
                <span role="img" aria-label="people">
                  👥
                </span>
              </div>
              <h3 className={styles.featureCardTitle}>Track by Person</h3>
              <p className={styles.featureCardDesc}>
                Create profiles for people in your life — Self, Partner, Family,
                Friends. See exactly how much you spend on each person.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={`${styles.featureIconWrap} ${styles.featureIconGreen}`}
              >
                <span role="img" aria-label="scissors">
                  ✂️
                </span>
              </div>
              <h3 className={styles.featureCardTitle}>Split Like Splitwise</h3>
              <p className={styles.featureCardDesc}>
                Create groups, add expenses, split equally or by exact amounts.
                Track who owes whom and settle up easily.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={`${styles.featureIconWrap} ${styles.featureIconBlue}`}
              >
                <span role="img" aria-label="chart">
                  📊
                </span>
              </div>
              <h3 className={styles.featureCardTitle}>Visual Insights</h3>
              <p className={styles.featureCardDesc}>
                Beautiful charts showing spending by profile, category, and
                monthly trends. Know your money better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Get started in 3 simple steps
            </h2>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h3 className={styles.stepTitle}>Create your profiles</h3>
              <p className={styles.stepDesc}>
                Add the people you spend on: Self, Partner, Family, Friends.
              </p>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h3 className={styles.stepTitle}>Track every expense</h3>
              <p className={styles.stepDesc}>
                Log expenses and tag them to profiles. Add income too.
              </p>
            </div>

            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <h3 className={styles.stepTitle}>See where your money goes</h3>
              <p className={styles.stepDesc}>
                Beautiful analytics show spending by person, category, and
                trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <div className={styles.ctaSparkle} aria-hidden="true" />
          <h2 className={styles.ctaBannerTitle}>
            Ready to take control of your finances?
          </h2>
          <p className={styles.ctaBannerSubtitle}>
            Join thousands tracking their money smarter.
          </p>
          <Link href="/register" className={styles.ctaBannerBtn}>
            Get Started Free <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>
            &copy; 2026 Bakaya. Built with love by ZTaS
          </p>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>
              Privacy
            </a>
            <a href="#" className={styles.footerLink}>
              Terms
            </a>
            <a href="#" className={styles.footerLink}>
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

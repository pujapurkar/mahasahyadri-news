"use client";

import { useState } from "react";

export default function SubAdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsLoading(true);

  try {
    const res = await fetch("/api/subadmin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await res.json();

    if (data.status === "OK") {
      alert("Login Successful");
      localStorage.setItem("role", "subadmin");
      window.location.href = "/admin/dashboard";
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert("Something went wrong");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sub Admin Login</h1>
        <p style={styles.subtitle}>Enter your credentials to access sub admin panel</p>

        <div style={styles.form}>
          {/* Username */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#3b82f6";
                (e.target as HTMLInputElement).style.boxShadow =
                  "0 0 0 3px rgba(59,130,246,0.15)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#d1d5db";
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: "48px" }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#3b82f6";
                  (e.target as HTMLInputElement).style.boxShadow =
                    "0 0 0 3px rgba(59,130,246,0.15)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#d1d5db";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              ...styles.loginButton,
              opacity: isLoading ? 0.8 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.target as HTMLButtonElement).style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "#3b82f6";
            }}
          >
            {isLoading ? "Signing in…" : "Login"}
          </button>

          {/* Footer Links */}
          <div style={styles.footerLinks}>
            
            <a href="/admin/forgot-password" style={styles.link}>
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 50%, #bfdbfe 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif",
    padding: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    margin: "0 0 8px 0",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center",
    margin: "0 0 32px 0",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#111827",
    backgroundColor: "#f9fafb",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  eyeButton: {
    position: "absolute",
    right: "14px",
    background: "none",
    border: "none",
    padding: "0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  },
  loginButton: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    transition: "background-color 0.15s ease",
    letterSpacing: "0.2px",
    marginTop: "4px",
  },
  footerLinks: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: "4px",
  },
  link: {
    fontSize: "14px",
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.15s ease",
  },
};
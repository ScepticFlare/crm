import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { pingHealth } from "../services/api";
import { jwtDecode } from "jwt-decode";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // Render free-tier cold start: the backend can be asleep when this page
    // loads. Ping the public /health route once in the background so it
    // starts waking up while the user is still typing their credentials,
    // instead of only starting on the login submit itself. Fire-and-forget -
    // a slow/failed health check must never block typing or show an error;
    // if the backend really is unreachable, the login submit below will
    // surface that on its own.
    useEffect(() => {
        pingHealth().catch(() => {});
    }, []);

    async function handleLogin() {

        try {

            setLoading(true);
            setError("");

            const response = await login(email, password);

            localStorage.setItem("token", response.token);

            const decoded = jwtDecode(response.token);

            localStorage.setItem("role", decoded.role);
            localStorage.setItem("employeeId", response.employeeId);
            localStorage.setItem("employeeName", response.employeeName);

            navigate("/dashboard");

        }  catch (err) {

    console.error("LOGIN ERROR:", err);

    // err.response only exists when the backend actually answered with an
    // HTTP status (e.g. 401 for a wrong email/password). A timeout or
    // network failure - the cold-start case, where the request never got a
    // response at all - leaves err.response undefined, so this tells the
    // two apart without guessing at axios error codes.
    if (err.response) {
        setError("Invalid email or password");
    } else {
        setError("Server is taking longer than usual to respond. Please try again.");
    }

} finally {

            setLoading(false);

        }

    }

    return (

        <div
            className="container-fluid vh-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: "#f5f7fb" }}
        >

            <div
                className="card border-0 shadow-lg p-5"
                style={{ width: "430px", borderRadius: "20px" }}
            >

                <div className="text-center mb-4">

                    <i
                        className="bi bi-people-fill"
                        style={{ fontSize: "55px", color: "#0d6efd" }}
                    ></i>

                    <h1 className="fw-bold mt-2">
                        Compact CRM
                    </h1>

                    <p className="text-muted">
                        Customer Relationship Management
                    </p>

                </div>

                <div className="mb-3">

                    <label className="form-label">
                        Email
                    </label>

                    <div className="input-group">

                        <span className="input-group-text">
                            <i className="bi bi-envelope-fill"></i>
                        </span>

                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                    </div>

                </div>

                <div className="mb-3">

                    <label className="form-label">
                        Password
                    </label>

                    <div className="input-group">

                        <span className="input-group-text">
                            <i className="bi bi-lock-fill"></i>
                        </span>

                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <i
                                className={
                                    showPassword
                                        ? "bi bi-eye-slash-fill"
                                        : "bi bi-eye-fill"
                                }
                            ></i>
                        </button>

                    </div>

                </div>

                <div className="form-check mb-4">

                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        id="remember"
                    />

                    <label
                        className="form-check-label"
                        htmlFor="remember"
                    >
                        Remember Me
                    </label>

                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <button
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>

                <p className="text-center text-muted mt-4 mb-0">
                    Version 1.0
                </p>

            </div>

        </div>

    );

}

export default Login;
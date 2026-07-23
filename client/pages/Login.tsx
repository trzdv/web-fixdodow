import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateCredentials, saveAuth } from "@/lib/auth";
import { LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = validateCredentials(username, password);
      
      if (user) {
        const authState = {
          isAuthenticated: true,
          user,
          token: Math.random().toString(36).substr(2, 9),
        };
        saveAuth(authState);
        navigate("/admin");
      } else {
        setError("Invalid username or password");
        setPassword("");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F6F2EC" }}>
      <div className="w-full max-w-md px-4">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: "#e93faa" }}>
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: "Cormorant Garamond", color: "#1a1a1a" }}>
            Admin Login
          </h1>
          <p className="text-gray-600" style={{ fontFamily: "Karla" }}>
            Sign in to manage your content
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!username || !password || isLoading}
              className="w-full py-3 px-4 text-white rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "#e93faa" }}
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

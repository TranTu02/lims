import { useState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; // Ensure this path exists or adjustment needed
import { useNavigate, useSearchParams } from "react-router-dom";
import LogoFull from "@/assets/LOGO-FULL.png";

export function LoginPage() {
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Handle 401 redirect reason
    useEffect(() => {
        const reason = searchParams.get("reason");
        if (reason === "401") {
            setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            setError("Vui lòng nhập tên đăng nhập và mật khẩu");
            return;
        }

        setIsLoading(true);
        try {
            const ok = await login(username, password);
      
            if (ok) {
              navigate("/reception", { replace: true });
            } else {
              setError("Tên đăng nhập hoặc mật khẩu không đúng.");
            }
          } finally {
            setIsLoading(false);
          }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8 flex justify-center">
                    <img src={LogoFull} alt="CRM Logo" className="h-24 w-auto object-contain" />
                </div>

                {/* Login Card */}
                <div className="bg-card rounded-lg shadow-md p-8 border border-border">
                    <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Đăng nhập hệ thống</h2>
                    <p className="text-center text-muted-foreground text-sm mb-6">Laboratory Information Management System</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium block mb-2 text-foreground">Tên đăng nhập</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-input text-foreground text-sm"
                                placeholder="admin"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-2 text-foreground">Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-input text-foreground text-sm"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm flex items-start gap-2">
                                <span>•</span>
                                <div>{error}</div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded flex items-center justify-center gap-2 transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                            <LogIn className="w-4 h-4" />
                            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-6 text-xs text-muted-foreground">
                    <p>© 2026 LIMS. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

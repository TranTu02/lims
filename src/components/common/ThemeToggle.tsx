import { useTheme } from "@/config/theme";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex gap-2">
            <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-lg transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                title="Light Mode"
            >
                <Sun className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                title="Dark Mode"
            >
                <Moon className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-2 rounded-lg transition-colors ${theme === "system" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                title="System Theme"
            >
                <Laptop className="h-4 w-4" />
            </button>
        </div>
    );
}

import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
    title: string;
    description: string;
}

export function Header({ title, description }: HeaderProps) {
    const { logout, user } = useAuth(); // Assuming useAuth is available and consistent with other files

    const handleLogout = () => {
        logout();
        // Redirect handled by AuthContext or Router logic usually
    };

    return (
        <header className="h-16 px-6 bg-background border-b border-border flex items-center justify-between sticky top-0 z-10">
            {/* Title Section */}
            <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-4">
                {/* Global Search - Optional */}
                <div className="hidden md:flex relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm nhanh..." className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary" />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background"></span>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                            <User className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.identityName || "Người dùng"}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Hồ sơ cá nhân</DropdownMenuItem>
                        <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                            Đăng xuất
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCircle2, AlertTriangle, Info, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
    id: string;
    type: "success" | "warning" | "info" | "error";
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    link?: string;
}

const mockNotifications: Notification[] = [
    {
        id: "n1",
        type: "warning",
        title: "Kết quả cần thực hiện lại",
        message: "Kết quả BOD5 mẫu TNM2501-001-S01 vượt ngưỡng, yêu cầu thực hiện lại",
        timestamp: "10 phút trước",
        isRead: false,
        link: "/technician",
    },
    {
        id: "n2",
        type: "success",
        title: "Kết quả đã được phê duyệt",
        message: "Kết quả E.Coli mẫu TNM2501-002-S01 đã được trưởng phòng phê duyệt",
        timestamp: "1 giờ trước",
        isRead: false,
    },
    {
        id: "n3",
        type: "info",
        title: "Phiếu mới tiếp nhận",
        message: "Phiếu TNM2501-006 từ Công ty TNHH GHI đã được tiếp nhận",
        timestamp: "2 giờ trước",
        isRead: false,
    },
    {
        id: "n4",
        type: "warning",
        title: "Hóa chất sắp hết hạn",
        message: "Methanol HPLC Grade (Batch M99887) sẽ hết hạn trong 7 ngày",
        timestamp: "3 giờ trước",
        isRead: true,
    },
    {
        id: "n5",
        type: "error",
        title: "Thiết bị quá hạn hiệu chuẩn",
        message: "HPLC Shimadzu (EQ-008) đã quá hạn hiệu chuẩn 13 ngày",
        timestamp: "5 giờ trước",
        isRead: true,
    },
    {
        id: "n6",
        type: "info",
        title: "Công việc mới được gán",
        message: "Bạn được gán 3 mẫu mới cần thực hiện phân tích pH",
        timestamp: "1 ngày trước",
        isRead: true,
    },
];

const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
        case "success":
            return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
        case "warning":
            return <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
        case "error":
            return <AlertTriangle className="h-5 w-5 text-destructive" />;
        case "info":
            return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
};

const getNotificationBgColor = (type: Notification["type"]) => {
    switch (type) {
        case "success":
            return "bg-green-50 dark:bg-green-900/10";
        case "warning":
            return "bg-orange-50 dark:bg-orange-900/10";
        case "error":
            return "bg-destructive/10";
        case "info":
            return "bg-blue-50 dark:bg-blue-900/10";
        default:
            return "bg-muted";
    }
};

export function NotificationPanel() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState(mockNotifications);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markAsRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const unreadNotifications = notifications.filter((n) => !n.isRead);

    return (
        <>
            {/* Notification Bell Button */}
            <div className="relative">
                <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0" onClick={() => setIsOpen(!isOpen)}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)}></div>

                    {/* Panel */}
                    <div className="fixed top-16 right-4 w-96 bg-card rounded-lg border border-border shadow-lg z-50">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-foreground">{t("notifications.title")}</h3>
                                <p className="text-sm text-muted-foreground">{unreadCount > 0 ? t("notifications.unreadCount", { count: unreadCount }) : t("notifications.empty")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <Button size="sm" variant="ghost" onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-foreground">
                                        <Check className="h-4 w-4 mr-1" />
                                        {t("notifications.markAllRead")}
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="w-full justify-start px-4 pt-2">
                                <TabsTrigger value="all">
                                    {t("notifications.tabs.all")} ({notifications.length})
                                </TabsTrigger>
                                <TabsTrigger value="unread">
                                    {t("notifications.tabs.unread")} ({unreadCount})
                                </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="h-[500px]">
                                <TabsContent value="all" className="mt-0">
                                    <div className="divide-y divide-border">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                                <p>{t("notifications.empty")}</p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div key={notification.id} className={`p-4 hover:bg-accent/30 transition-colors ${!notification.isRead ? "bg-primary/5 dark:bg-primary/10" : ""}`}>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>{getNotificationIcon(notification.type)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h4 className="font-medium text-foreground text-sm">{notification.title}</h4>
                                                                {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"></div>}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                                                                <div className="flex items-center gap-1">
                                                                    {!notification.isRead && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => markAsRead(notification.id)}
                                                                            className="h-7 text-xs px-2 text-primary hover:text-primary/90"
                                                                        >
                                                                            {t("notifications.markRead")}
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => deleteNotification(notification.id)}
                                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                        title={t("notifications.delete")}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="unread" className="mt-0">
                                    <div className="divide-y divide-border">
                                        {unreadNotifications.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                                <p>{t("notifications.emptyUnread")}</p>
                                            </div>
                                        ) : (
                                            unreadNotifications.map((notification) => (
                                                <div key={notification.id} className="p-4 hover:bg-accent/30 transition-colors bg-primary/5 dark:bg-primary/10">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>{getNotificationIcon(notification.type)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h4 className="font-medium text-foreground text-sm">{notification.title}</h4>
                                                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"></div>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="h-7 text-xs px-2 text-primary hover:text-primary/90"
                                                                    >
                                                                        {t("notifications.markRead")}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => deleteNotification(notification.id)}
                                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>
                </>
            )}
        </>
    );
}

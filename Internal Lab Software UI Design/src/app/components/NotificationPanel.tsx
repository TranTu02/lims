import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X, Check } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Kết quả cần thực hiện lại',
    message: 'Kết quả BOD5 mẫu TNM2501-001-S01 vượt ngưỡng, yêu cầu thực hiện lại',
    timestamp: '10 phút trước',
    isRead: false,
    link: '/technician',
  },
  {
    id: 'n2',
    type: 'success',
    title: 'Kết quả đã được phê duyệt',
    message: 'Kết quả E.Coli mẫu TNM2501-002-S01 đã được trưởng phòng phê duyệt',
    timestamp: '1 giờ trước',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'info',
    title: 'Phiếu mới tiếp nhận',
    message: 'Phiếu TNM2501-006 từ Công ty TNHH GHI đã được tiếp nhận',
    timestamp: '2 giờ trước',
    isRead: false,
  },
  {
    id: 'n4',
    type: 'warning',
    title: 'Hóa chất sắp hết hạn',
    message: 'Methanol HPLC Grade (Batch M99887) sẽ hết hạn trong 7 ngày',
    timestamp: '3 giờ trước',
    isRead: true,
  },
  {
    id: 'n5',
    type: 'error',
    title: 'Thiết bị quá hạn hiệu chuẩn',
    message: 'HPLC Shimadzu (EQ-008) đã quá hạn hiệu chuẩn 13 ngày',
    timestamp: '5 giờ trước',
    isRead: true,
  },
  {
    id: 'n6',
    type: 'info',
    title: 'Công việc mới được gán',
    message: 'Bạn được gán 3 mẫu mới cần thực hiện phân tích pH',
    timestamp: '1 ngày trước',
    isRead: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
};

const getNotificationBgColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-50';
    case 'warning':
      return 'bg-orange-50';
    case 'error':
      return 'bg-red-50';
    case 'info':
      return 'bg-blue-50';
    default:
      return 'bg-gray-50';
  }
};

export function NotificationPanel() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="fixed top-16 right-4 w-96 bg-white rounded-lg border shadow-lg z-50">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Thông báo</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Đánh dấu đã đọc
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start px-4 pt-2">
                <TabsTrigger value="all">Tất cả ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px]">
                <TabsContent value="all" className="mt-0">
                  <div className="divide-y">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Không có thông báo</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {notification.timestamp}
                                </span>
                                <div className="flex items-center gap-1">
                                  {!notification.isRead && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-7 text-xs px-2"
                                    >
                                      Đánh dấu đã đọc
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
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
                  <div className="divide-y">
                    {unreadNotifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Không có thông báo chưa đọc</p>
                      </div>
                    ) : (
                      unreadNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 transition-colors bg-blue-50/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </h4>
                                <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1"></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {notification.timestamp}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-7 text-xs px-2"
                                  >
                                    Đánh dấu đã đọc
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
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

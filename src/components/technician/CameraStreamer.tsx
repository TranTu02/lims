import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, VideoOff, RefreshCw, Image as ImageIcon, Trash2, Maximize2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CameraStreamerProps {
    deviceType: "microscope" | "tlc";
}

interface CapturedPhoto {
    id: string;
    url: string;
    timestamp: string;
}

export function CameraStreamer({ deviceType }: CameraStreamerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    // Fetch video input devices
    const getDevices = useCallback(async () => {
        try {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === "videoinput");
            setDevices(videoDevices);
            if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (e) {
            console.error("Error enumerating devices:", e);
        }
    }, [selectedDeviceId]);

    // Start video stream
    const startStream = useCallback(async (deviceId: string) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Trình duyệt của bạn không hỗ trợ truy cập Camera.");
            return;
        }

        setIsLoading(true);
        setPermissionDenied(false);

        // Stop existing stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            // Enumerate devices again after permission granted to retrieve labels
            getDevices();
        } catch (err: any) {
            console.error("Camera access error:", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setPermissionDenied(true);
                toast.error("Quyền truy cập Camera bị từ chối.");
            } else {
                toast.error("Không thể kết nối đến camera.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [stream, getDevices]);

    // Stop video stream
    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, [stream]);

    // Initialize camera on mount or selection change
    useEffect(() => {
        if (selectedDeviceId) {
            startStream(selectedDeviceId);
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDeviceId]);

    const handleCameraChange = (val: string) => {
        setSelectedDeviceId(val);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current || !stream) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const url = canvas.toDataURL("image/png");
            const newPhoto: CapturedPhoto = {
                id: crypto.randomUUID(),
                url,
                timestamp: new Date().toLocaleTimeString("vi-VN")
            };

            setCapturedPhotos(prev => [newPhoto, ...prev]);
            toast.success("Đã chụp ảnh kiểm nghiệm từ camera.");
        }
    };

    const handleDeletePhoto = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCapturedPhotos(prev => prev.filter(p => p.id !== id));
        if (selectedPhoto === id) {
            setSelectedPhoto(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0 bg-background">
            {/* Left Panel: Camera Streamer Controls */}
            <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Camera className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm text-foreground">
                            {deviceType === "microscope" ? "Kính hiển vi kỹ thuật số" : "Buồng sắc ký TLC"}
                        </h3>
                    </div>

                    {/* Camera Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Thiết bị Camera</label>
                        <Select value={selectedDeviceId} onValueChange={handleCameraChange}>
                            <SelectTrigger className="h-9 text-xs bg-background">
                                <SelectValue placeholder="Chọn Camera..." />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                ))}
                                {devices.length === 0 && (
                                    <SelectItem value="none" disabled>Không tìm thấy camera</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Control Actions */}
                    <div className="flex gap-2">
                        {stream ? (
                            <Button variant="destructive" size="sm" className="flex-1" onClick={stopStream}>
                                <VideoOff className="w-4 h-4 mr-2" />
                                Ngắt kết nối
                            </Button>
                        ) : (
                            <Button variant="default" size="sm" className="flex-1" onClick={() => startStream(selectedDeviceId)}>
                                <Camera className="w-4 h-4 mr-2" />
                                Kết nối Camera
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={getDevices} title="Tải lại danh sách thiết bị">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>

                    <div className="border-t border-border pt-4">
                        <Button 
                            className="w-full text-sm font-semibold h-10 shadow-sm" 
                            disabled={!stream} 
                            onClick={handleCapture}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Chụp ảnh thử nghiệm
                        </Button>
                    </div>
                </div>

                {/* Snapshots Panel */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm flex-1 min-h-[200px]">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-semibold text-sm text-foreground">Ảnh đã chụp ({capturedPhotos.length})</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 max-h-[300px] lg:max-h-none pr-1">
                        {capturedPhotos.map(photo => (
                            <div 
                                key={photo.id}
                                onClick={() => setSelectedPhoto(photo.url)}
                                className={`group relative aspect-video bg-neutral-900 border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                    selectedPhoto === photo.url ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground"
                                }`}
                            >
                                <img src={photo.url} alt="captured" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[9px] text-white font-mono flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>{photo.timestamp}</span>
                                    <button 
                                        onClick={(e) => handleDeletePhoto(photo.id, e)}
                                        className="text-red-400 hover:text-red-300 p-0.5"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {capturedPhotos.length === 0 && (
                            <div className="col-span-2 flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed border-border rounded-lg h-full">
                                <ImageIcon className="w-8 h-8 opacity-30 mb-2" />
                                <p className="text-xs">Chưa có ảnh nào được chụp</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Viewport */}
            <div className="flex-1 min-h-[350px] bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl relative overflow-hidden flex items-center justify-center select-none">
                {/* Focus Target / Grids */}
                {stream && (
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
                        {deviceType === "microscope" ? (
                            // Circle focusing grid
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-dashed border-emerald-400/50 rounded-full" />
                                <div className="w-80 h-80 border border-emerald-400/30 rounded-full" />
                                <div className="absolute w-8 border-t-2 border-emerald-400/60" />
                                <div className="absolute h-8 border-l-2 border-emerald-400/60" />
                            </div>
                        ) : (
                            // TLC Lane Grids
                            <div className="absolute inset-0 flex justify-around">
                                <div className="h-full border-r border-dashed border-sky-400/30" />
                                <div className="h-full border-r border-dashed border-sky-400/30" />
                                <div className="h-full border-r border-dashed border-sky-400/30" />
                                <div className="h-full border-r border-dashed border-sky-400/30" />
                            </div>
                        )}
                        {/* Edge scanning corners */}
                        <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-white/50" />
                        <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-white/50" />
                        <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-white/50" />
                        <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-white/50" />
                    </div>
                )}

                {/* Active Stream / Image Display */}
                {selectedPhoto ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                        <img src={selectedPhoto} alt="preview" className="max-w-full max-h-full object-contain" />
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="absolute top-4 right-4 bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            Quay lại live
                        </Button>
                    </div>
                ) : permissionDenied ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm text-neutral-400">
                        <ShieldAlert className="w-12 h-12 text-destructive animate-bounce" />
                        <h4 className="font-bold text-neutral-200">Không có quyền truy cập camera</h4>
                        <p className="text-xs">
                            Vui lòng cấp quyền truy cập camera trên trình duyệt của bạn hoặc chọn thiết bị camera khác từ bảng điều khiển bên trái.
                        </p>
                    </div>
                ) : stream ? (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 text-neutral-500">
                        <VideoOff className="w-12 h-12 opacity-30 animate-pulse" />
                        <h4 className="font-semibold text-neutral-400 uppercase tracking-widest text-xs">Offline</h4>
                        <p className="text-[10px] max-w-xs font-mono">
                            Kết nối thiết bị camera để truyền hình ảnh trực tiếp.
                        </p>
                    </div>
                )}

                {/* Metadata overlay */}
                <div className="absolute bottom-4 left-4 text-[9px] font-mono text-neutral-400 z-10 bg-black/55 px-2.5 py-1 rounded border border-neutral-800">
                    <span>MODE: {deviceType.toUpperCase()} | STREAM: {stream ? "ACTIVE" : "STANDBY"}</span>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-900/60" title="Toàn màn hình">
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Hidden canvas for drawing frame captures */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

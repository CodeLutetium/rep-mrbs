import { bot_telegram_url } from "@/pages/LinkTelegram";
import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { toast } from "sonner";
import { Download, Copy } from "lucide-react"; // Useful icons for the actions
import { Button } from "@/components/ui/button"; // Assuming you use shadcn/ui

export default function TelegramQRCode({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);
  const url = `${bot_telegram_url}?start=${code}`;

  useEffect(() => {
    qrCodeInstance.current = new QRCodeStyling({
      width: 280,
      height: 280,
      type: "svg",
      data: url,
      image: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
      dotsOptions: { color: "#229ED9", type: "rounded" },
      backgroundOptions: { color: "#ffffff" },
      imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.4 },
      cornersSquareOptions: { type: "extra-rounded", color: "#229ED9" },
      cornersDotOptions: { type: "dot", color: "#229ED9" },
    });

    if (ref.current) {
      ref.current.innerHTML = "";
      qrCodeInstance.current.append(ref.current);
    }
  }, [url]);

  const handleCopy = async () => {
    if (!qrCodeInstance.current) return;

    try {
      const blob = await qrCodeInstance.current.getRawData("png");
      if (!blob) throw new Error("Failed to generate image blob");

      const data = [new ClipboardItem({ "image/png": blob })];
      await navigator.clipboard.write(data);
      toast.success("QR Code copied to clipboard!");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Failed to copy image. Use a secure context (HTTPS).");
    }
  };

  const handleDownload = async () => {
    if (!qrCodeInstance.current) return;

    try {
      // Library helper to trigger a browser download
      await qrCodeInstance.current.download({
        name: `reppybooky-link-${code}`,
        extension: "png",
      });
      toast.success("Downloading QR Code...");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download image.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
      <div
        ref={ref}
        onClick={handleCopy}
        title="Click to copy QR Code"
        className="rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-gray-100 cursor-pointer transition-transform active:scale-95 hover:opacity-90"
      />

      <p className="text-xs text-muted-foreground italic">
        Scan to link account
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex cursor-pointer items-center gap-2 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95"
        >
          <Copy size={16} className="transition-transform group-hover:scale-110" />
          Copy
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex cursor-pointer items-center gap-2 transition-all duration-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 active:scale-95"
        >
          <Download size={16} className="transition-transform group-hover:scale-110" />
          Save
        </Button>
      </div>

    </div>
  );
}

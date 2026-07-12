import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 256 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: size * 2,
      color: { dark: "#2b1d14", light: "#00000000" },
    }).then(setDataUrl);
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="rounded-2xl bg-accent-soft animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className="rounded-2xl"
      style={{ width: size, height: size }}
    />
  );
}

import os from "os";
import { NextResponse } from "next/server";

function getLanAddresses(): string[] {
  const addresses: string[] = [];
  const interfaces = os.networkInterfaces();

  for (const ifaceList of Object.values(interfaces)) {
    for (const iface of ifaceList ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

export async function GET(request: Request) {
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.")
    ? "http"
    : request.headers.get("x-forwarded-proto") ?? "http";

  const lanIps = getLanAddresses();
  const shareUrls = lanIps.map((ip) => {
    const port = host.includes(":") ? host.split(":")[1] : "80";
    const usePort = port === "80" ? "" : `:${port}`;
    return `${protocol}://${ip}${usePort}`;
  });

  return NextResponse.json({
    localUrl: `${protocol}://${host}`,
    shareUrls,
    note:
      "studysummarizer 仅在你自己的电脑上有效。其他同学请使用下方局域网地址（需同一 WiFi）。",
  });
}

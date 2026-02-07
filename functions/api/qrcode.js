import * as QRCode from "qrcode";

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const token = body?.info?.channel_info?.token;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "token missing" }),
        { status: 400 }
      );
    }

    const url =
      `https://myun.tenpay.com/mqq/pay/index.shtml?_wv=1027&app_jump=1&t=${token}`;

    // ✅ 生成 SVG（二进制 / canvas 都不需要）
    const svg = await QRCode.toString(url, {
      type: "svg",
      margin: 2,
      width: 280,
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

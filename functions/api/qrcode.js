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

    const pngBuffer = await QRCode.toBuffer(url, {
      width: 280,
      margin: 2,
    });

    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
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

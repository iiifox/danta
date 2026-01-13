export async function onRequest({request}) {
    // 只允许 POST
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {status: 405});
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response('Bad Request', {status: 400});
    }

    const text = body?.text;
    if (!text) {
        return new Response(JSON.stringify({
            success: false,
            message: 'text is empty'
        }), {
            headers: {'Content-Type': 'application/json'}
        });
    }

    // 🔒 核心逻辑（不暴露在前端）
    function toHtmlEntity(str) {
        return Array.from(str)
            .map(ch => `&#${ch.codePointAt(0)};`)
            .join('');
    }

    const result = toHtmlEntity(text);

    return new Response(JSON.stringify({
        success: true,
        result
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

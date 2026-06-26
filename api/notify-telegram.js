const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8777658261:AAFoHtYFae9-E48KisHaj4cJ0ZBqJfD5PkI';
const TELEGRAM_OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID || '7388939819';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!TELEGRAM_OWNER_CHAT_ID) {
      console.error('[TELEGRAM] TELEGRAM_OWNER_CHAT_ID belum di-set');
      return res.status(200).json({ ok: false, error: 'chat_id belum dikonfigurasi' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') {
      try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
    }

    const {
      orderId = '-',
      productName = '-',
      qty = 1,
      total = 0,
      method = '-',
      buyerName = '-',
      status = 'pending' // 'pending' (baru klik "saya sudah transfer") | 'paid' (terverifikasi otomatis)
    } = body;

    const statusText = status === 'paid'
      ? '✅ *LUNAS (terverifikasi otomatis)*'
      : '🕓 *Menunggu verifikasi* (klaim sudah transfer manual)';

    const text =
`🛎️ *PESANAN BARU — YannMarket*

📋 Order ID: \`${orderId}\`
👤 Pembeli: ${buyerName}
📦 Produk: ${productName}${qty > 1 ? ` (x${qty})` : ''}
💳 Metode: ${method}
💰 Total: Rp ${Number(total).toLocaleString('id-ID')}

Status: ${statusText}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_OWNER_CHAT_ID,
        text,
        parse_mode: 'Markdown'
      })
    });
    const data = await tgRes.json();

    if (!data.ok) {
      console.error('[TELEGRAM SEND ERROR]', data);
      return res.status(200).json({ ok: false, error: data.description || 'Gagal kirim notifikasi' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[TELEGRAM NOTIFY EXCEPTION]', err);
    return res.status(200).json({ ok: false, error: String(err) });
  }
};

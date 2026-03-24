export default async function handler(req, res) {
  // Отримуємо шлях від нашого додатку
  const { endpoint } = req.query;
  const targetUrl = `https://api.notion.com${endpoint}`;

  // Ключ береться безпечно напряму з серверів Vercel
  const NOTION_TOKEN = process.env.VITE_NOTION_TOKEN;

  const options = {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    }
  };

// Передаємо дані (фільтри, галочки) тільки для POST та PATCH
  if (req.method !== 'GET') {
    // Страхуємось, щоб Vercel не зламав наші дані при натисканні на галочку
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Помилка на сервері:", error);
    res.status(500).json({ error: "Server error" });
  }
}
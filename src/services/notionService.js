const DATABASE_ID = import.meta.env.VITE_NOTION_DATABASE_ID;

/**
 * 1. Отримує список задач
 */
export const fetchNotionTasks = async () => {
  try {
    const response = await fetch(`/api/notion?endpoint=/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: {
          property: "🌸",
          checkbox: { equals: false }
        }
      })
    });
    
    const data = await response.json();
    if (!data.results) return [];

    return data.results.map(page => {
      const titleProp = Object.values(page.properties).find(p => p.type === 'title');
      return {
        id: page.id,
        text: titleProp?.title[0]?.plain_text || "Без назви",
        completed: page.properties["🌸"]?.checkbox || false
      };
    });
  } catch (error) {
    console.error("Помилка отримання списку задач:", error);
    return [];
  }
};

/**
 * 2. Отримує та парсить детальні кроки
 */
export const fetchTaskSteps = async (pageId) => {
  try {
    const response = await fetch(`/api/notion?endpoint=/v1/blocks/${pageId}/children`);
    const data = await response.json();
    let allSteps = [];
    const timeRegex = /\((\d+)\s*хв\)/;

    if (!data.results) return [];

    data.results.forEach(block => {
      const richText = block.paragraph?.rich_text || 
                       block.numbered_list_item?.rich_text || 
                       block.bulleted_list_item?.rich_text || [];
      const text = richText.map(t => t.plain_text).join('');
      
      if (text) {
        const parts = text.split(/(?=\d+\.\s|\*\*Крок|Крок\s*\d+:|\n)/g); 
        parts.forEach(part => {
          const timeMatch = part.match(timeRegex);
          if (timeMatch) {
            let cleanText = part
              .replace(timeRegex, '')
              .replace(/\*/g, '')
              .replace(/^[\d+\.\s|Крок\s*\d+:\s|-]*/i, '')
              .trim();

            if (cleanText.length > 2) {
              allSteps.push({ text: cleanText, minutes: parseInt(timeMatch[1]) });
            }
          }
        });
      }
    });
    return allSteps;
  } catch (error) {
    console.error("Помилка парсингу кроків:", error);
    return [];
  }
};

/**
 * 3. Підрахунок сумарного часу
 */
export const fetchTaskTotalTime = async (pageId) => {
  try {
    const response = await fetch(`/api/notion?endpoint=/v1/blocks/${pageId}/children`);
    const data = await response.json();
    let total = 0;
    const timeRegex = /\((\d+)\s*хв\)/g;

    if (!data.results) return 0;

    data.results.forEach(block => {
      const richText = block.paragraph?.rich_text || 
                       block.numbered_list_item?.rich_text || 
                       block.bulleted_list_item?.rich_text || [];
      const text = richText.map(t => t.plain_text).join('');
      
      if (text) {
        let match;
        while ((match = timeRegex.exec(text)) !== null) {
          total += parseInt(match[1]);
        }
      }
    });
    
    return total;
  } catch (error) {
    console.error("Помилка підрахунку часу:", error);
    return 0;
  }
};

/**
 * 4. Ставить галочку в стовпці 🌸 (завершує задачу)
 */
export const markTaskAsDone = async (pageId) => {
  try {
    const response = await fetch(`/api/notion?endpoint=/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { "🌸": { checkbox: true } }
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Помилка оновлення чекбоксу 🌸 в Notion:", error);
    throw error;
  }
};
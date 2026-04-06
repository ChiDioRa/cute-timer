const DATABASE_ID = import.meta.env.VITE_NOTION_DATABASE_ID;
const BASE_URL = "/api/notion?endpoint=";

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

const apiRequest = async (path, method = "GET", body = null) => {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(
      `${BASE_URL}${encodeURIComponent(path)}`,
      options,
    );
    return await response.json();
  } catch (error) {
    console.error(`Помилка запиту (${path}):`, error);
    return null;
  }
};

const getBlocksContent = async (pageId) => {
  const data = await apiRequest(`/v1/blocks/${pageId}/children`);
  if (!data?.results) return [];

  return data.results
    .map((block) => {
      const richText =
        block.paragraph?.rich_text ||
        block.numbered_list_item?.rich_text ||
        block.bulleted_list_item?.rich_text ||
        [];
      return richText.map((t) => t.plain_text).join("");
    })
    .filter((text) => text.length > 0);
};

// --- ОСНОВНІ ЕКСПОРТИ ---

export const fetchNotionTasks = async () => {
  const data = await apiRequest(`/v1/databases/${DATABASE_ID}/query`, 'POST', {
    filter: { property: "🌸", checkbox: { equals: false } },
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending"
      }
    ]
  });
  
  if (!data?.results) return [];

  // ✨ Ось тут була помилка (page is not defined), тепер все ідеально:
  return Promise.all(data.results.map(async (page) => {
    const titleProp = Object.values(page.properties).find(p => p.type === 'title');
    const totalTime = await fetchTaskTotalTime(page.id);

    return {
      id: page.id,
      text: titleProp?.title[0]?.plain_text || "Без назви",
      completed: page.properties["🌸"]?.checkbox || false,
      isRoutine: page.properties["Routine"]?.checkbox || false,
      repetitions: page.properties["Repetitions"]?.number || 0,
      totalTime, 
      createdAt: page.created_time, 
      savedStep: page.properties["Current Step"]?.number || 0,
      savedSeconds: page.properties["Elapsed Seconds"]?.number || 0
    };
  }));
};

export const fetchTaskSteps = async (pageId) => {
  const texts = await getBlocksContent(pageId);
  const steps = [];
  const timeRegex = /\((\d+)\s*хв\)/i;

  texts.forEach((text) => {
    const parts = text.split(/(?=\d+\.\s|\*\*Крок|Крок\s*\d+:|\n)/g);
    parts.forEach((part) => {
      const match = part.match(timeRegex);
      if (match) {
        let cleanText = part
          .replace(timeRegex, "")
          .replace(/[*#]/g, "")
          .replace(/^\s*(?:Крок\s*\d+[:.]?\s*)?[\d.)\s*-]+/i, "")
          .trim();

        if (cleanText.length > 1) {
          steps.push({ text: cleanText, minutes: parseInt(match[1]) });
        }
      }
    });
  });
  return steps;
};

export const fetchTaskTotalTime = async (pageId) => {
  const texts = await getBlocksContent(pageId);
  let total = 0;
  
  const totalTimeRegex = /Загальний\s+час[:\s-]+(\d+)/i; 
  const stepsRegex = /\((\d+)\s*хв\)/gi;

  texts.forEach(text => {
    const mainMatch = text.match(totalTimeRegex);
    if (mainMatch) {
      total = parseInt(mainMatch[1]);
    } else if (total === 0) {
      let match;
      while ((match = stepsRegex.exec(text)) !== null) {
        total += parseInt(match[1]);
      }
    }
  });
  
  return total;
};

// --- ФУНКЦІЇ СТАТУСІВ ТА ОНОВЛЕНЬ ---

export const updateTaskStatusInNotion = async (pageId, isCompleted) => {
  return apiRequest(`/v1/pages/${pageId}`, "PATCH", {
    properties: { "🌸": { checkbox: isCompleted } },
  });
};

export const updateTaskTypeInNotion = async (pageId, isRoutine) => {
  return apiRequest(`/v1/pages/${pageId}`, "PATCH", {
    properties: { "Routine": { checkbox: isRoutine } },
  });
};

export const updateRepetitionsInNotion = async (pageId, count) => {
  return apiRequest(`/v1/pages/${pageId}`, "PATCH", {
    properties: { "Repetitions": { number: count } },
  });
};

export const deleteNotionTask = async (taskId) =>
  apiRequest(`/v1/pages/${taskId}`, "PATCH", { archived: true });

export const addNotionTask = async (title) =>
  apiRequest("/v1/pages", "POST", {
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      "🪄": { checkbox: true },
    },
  });

export const updateTaskProgress = async (pageId, stepIndex, seconds, totalSpentSeconds) => {
  const propertiesToUpdate = {
    "Current Step": { number: stepIndex },
    "Elapsed Seconds": { number: seconds },
  };

  if (totalSpentSeconds !== undefined) {
    propertiesToUpdate["Actual Time"] = { 
      number: Math.round(totalSpentSeconds / 60) 
    };
  }

  return apiRequest(`/v1/pages/${pageId}`, "PATCH", {
    properties: propertiesToUpdate,
  });
};
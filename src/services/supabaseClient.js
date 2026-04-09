import { createClient } from '@supabase/supabase-js';

// Vite використовує import.meta.env для доступу до змінних
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ... далі твої функції getFarmSave та updateFarmSave без змін

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- ІЗОЛЬОВАНІ ФУНКЦІЇ ДЛЯ ГРИ ---

// 1. Отримати або створити збереження
export const getFarmSave = async () => {
  const { data, error } = await supabase
    .from('idle_farm')
    .select('*')
    .eq('id', 'my_save')
    .single();

  if (error && error.code === 'PGRST116') {
    // Якщо збереження ще немає, створюємо перше
    const { data: newData } = await supabase
      .from('idle_farm')
      .insert([{ id: 'my_save', coins: 0, inventory: [] }])
      .select()
      .single();
    return newData;
  }
  
  return data;
};

// 2. Зберегти прогрес (відправити монетки і час у базу)
export const updateFarmSave = async (coins, inventory) => {
  const { error } = await supabase
    .from('idle_farm')
    .update({ 
      coins, 
      inventory, 
      last_login: new Date().toISOString() 
    })
    .eq('id', 'my_save');

  if (error) console.error("Помилка збереження ферми:", error);
};
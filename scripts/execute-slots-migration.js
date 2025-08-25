const { createClient } = require('@supabase/supabase-js')

async function executeSlotsMigration() {
  console.log('🚀 Выполняю миграцию слотов...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Update default slot to 'left'
    console.log('📝 Обновляю default slot...')
    await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE public.page_blocks ALTER COLUMN slot SET DEFAULT 'left';"
    })

    // Map existing slots for contact page
    console.log('📝 Маппинг слотов для contact...')
    await supabase.rpc('exec_sql', {
      sql: `
        WITH p AS (SELECT id FROM pages WHERE key='contact')
        UPDATE page_blocks SET slot='top'
         WHERE page_id=(SELECT id FROM p) AND type='contactsHero';
      `
    })

    await supabase.rpc('exec_sql', {
      sql: `
        WITH p AS (SELECT id FROM pages WHERE key='contact')
        UPDATE page_blocks SET slot='left'
         WHERE page_id=(SELECT id FROM p) AND type='contactFormBlock';
      `
    })

    await supabase.rpc('exec_sql', {
      sql: `
        WITH p AS (SELECT id FROM pages WHERE key='contact')
        UPDATE page_blocks SET slot='right'
         WHERE page_id=(SELECT id FROM p) AND type='contactChannels';
      `
    })

    // Compatibility mapping for old slots
    console.log('📝 Совместимость со старыми слотами...')
    await supabase.rpc('exec_sql', {
      sql: "UPDATE page_blocks SET slot='left' WHERE slot='main';"
    })

    await supabase.rpc('exec_sql', {
      sql: "UPDATE page_blocks SET slot='right' WHERE slot='aside';"
    })

    console.log('✅ Миграция слотов выполнена успешно!')
    
    // Check results
    const { data: blocks } = await supabase
      .from('page_blocks')
      .select('type, slot, position')
      .eq('page_id', (await supabase.from('pages').select('id').eq('key', 'contact').single()).data.id)
      .order('position')

    console.log('📊 Результат:')
    blocks.forEach(block => {
      console.log(`  ${block.type}: slot=${block.slot}, position=${block.position}`)
    })

  } catch (error) {
    console.error('❌ Ошибка миграции:', error)
  }
}

executeSlotsMigration()

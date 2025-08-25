const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Загружаем переменные окружения из .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Ошибка: Не найдены переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixContactBlocks() {
  console.log('🔧 Исправляю блоки Contact...')
  
  try {
    // 1. Найдем ID страницы contact
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id')
      .eq('key', 'contact')
      .single()
    
    if (pageError || !page) {
      console.log('❌ Страница contact не найдена')
      return
    }
    
    console.log('✅ Найдена страница contact, ID:', page.id)
    
    // 2. Включим блоки по умолчанию
    const { error: updateError } = await supabase
      .from('page_blocks')
      .update({ is_active: true })
      .eq('page_id', page.id)
      .in('type', ['contactsHero', 'contactFormBlock', 'contactChannels'])
    
    if (updateError) {
      console.log('❌ Ошибка обновления is_active:', updateError)
    } else {
      console.log('✅ Блоки активированы')
    }
    
    // 3. Получим все блоки для нормализации позиций
    const { data: blocks, error: blocksError } = await supabase
      .from('page_blocks')
      .select('id, position')
      .eq('page_id', page.id)
      .order('position', { ascending: true })
    
    if (blocksError) {
      console.log('❌ Ошибка получения блоков:', blocksError)
      return
    }
    
    console.log('📦 Найдено блоков:', blocks.length)
    
    // 4. Нормализуем позиции: 0, 10, 20...
    for (let i = 0; i < blocks.length; i++) {
      const newPosition = i * 10
      const { error: posError } = await supabase
        .from('page_blocks')
        .update({ position: newPosition })
        .eq('id', blocks[i].id)
      
      if (posError) {
        console.log(`❌ Ошибка обновления позиции для блока ${blocks[i].id}:`, posError)
      } else {
        console.log(`✅ Позиция блока ${blocks[i].id} обновлена: ${blocks[i].position} → ${newPosition}`)
      }
    }
    
    // 5. Проверим результат
    const { data: finalBlocks, error: finalError } = await supabase
      .from('page_blocks')
      .select('type, position, is_active, props')
      .eq('page_id', page.id)
      .order('position', { ascending: true })
    
    if (finalError) {
      console.log('❌ Ошибка получения финального результата:', finalError)
    } else {
      console.log('✅ Финальный результат:')
      finalBlocks.forEach(block => {
        console.log(`  - ${block.type}: position=${block.position}, active=${block.is_active}`)
      })
    }
    
    console.log('🎉 Блоки Contact исправлены!')
    
  } catch (error) {
    console.log('❌ Критическая ошибка:', error)
  }
}

fixContactBlocks()


const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSubcategories() {
  try {
    console.log('🔍 Проверяем подкатегории в базе данных...\n')

    // 1. Проверяем категории
    console.log('1. Категории:')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')

    if (categoriesError) {
      console.error('❌ Ошибка получения категорий:', categoriesError)
      return
    }

    console.log(`✅ Найдено категорий: ${categories.length}`)
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`)
    })

    // 2. Проверяем подкатегории
    console.log('\n2. Подкатегории:')
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select(`
        id, name, slug, description,
        categories(id, name, slug)
      `)
      .order('name')

    if (subcategoriesError) {
      console.error('❌ Ошибка получения подкатегорий:', subcategoriesError)
      return
    }

    console.log(`✅ Найдено подкатегорий: ${subcategories.length}`)
    if (subcategories.length === 0) {
      console.log('   ⚠️  Подкатегории не найдены!')
    } else {
      subcategories.forEach(sub => {
        const categoryName = sub.categories?.name || 'Unknown'
        console.log(`   - ${sub.name} (ID: ${sub.id}, slug: ${sub.slug}) -> ${categoryName}`)
      })
    }

    // 3. Проверяем подкатегории для Wall Panel
    console.log('\n3. Подкатегории для Wall Panel:')
    const { data: wallPanelSubs, error: wallPanelError } = await supabase
      .from('subcategories')
      .select(`
        id, name, slug, description,
        categories!inner(id, name, slug)
      `)
      .eq('categories.name', 'Wall Panel')
      .order('name')

    if (wallPanelError) {
      console.error('❌ Ошибка получения подкатегорий Wall Panel:', wallPanelError)
      return
    }

    console.log(`✅ Подкатегорий для Wall Panel: ${wallPanelSubs.length}`)
    if (wallPanelSubs.length === 0) {
      console.log('   ⚠️  Подкатегории для Wall Panel не найдены!')
      console.log('   💡 Нужно создать подкатегории Plain Color и Brick Structure')
    } else {
      wallPanelSubs.forEach(sub => {
        console.log(`   - ${sub.name} (ID: ${sub.id}, slug: ${sub.slug})`)
      })
    }

    // 4. Проверяем структуру таблицы subcategories
    console.log('\n4. Структура таблицы subcategories:')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'subcategories' })

    if (columnsError) {
      console.log('   ⚠️  Не удалось получить структуру через RPC')
      console.log('   Структура из примера: id, category_id, name, slug, description, image_url, sort_order, is_active, created_at, updated_at')
    } else {
      console.log('   ✅ Структура таблицы:')
      columns.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

checkSubcategories()

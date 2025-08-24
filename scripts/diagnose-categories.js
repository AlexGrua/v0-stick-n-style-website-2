const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseCategories() {
  console.log('🔍 Диагностика проблем с категориями...\n')

  try {
    // 1. Проверяем что лежит в categories.subs
    console.log('1️⃣ Проверяем содержимое categories.subs:')
    const { data: categoriesWithSubs, error: subsError } = await supabase
      .from('categories')
      .select('id, name, subs')
      .not('subs', 'is', null)
      .neq('subs', '[]')

    if (subsError) {
      console.error('❌ Ошибка при получении categories.subs:', subsError)
    } else {
      console.log(`📊 Найдено ${categoriesWithSubs?.length || 0} категорий с данными в subs:`)
      categoriesWithSubs?.forEach(cat => {
        console.log(`   ID ${cat.id}: "${cat.name}" → subs: ${JSON.stringify(cat.subs)}`)
      })
    }

    // 2. Проверяем реальные подкатегории
    console.log('\n2️⃣ Проверяем реальные подкатегории из таблицы subcategories:')
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .order('category_id, id')

    if (subError) {
      console.error('❌ Ошибка при получении subcategories:', subError)
    } else {
      console.log(`📊 Найдено ${subcategories?.length || 0} подкатегорий:`)
      subcategories?.forEach(sub => {
        console.log(`   ID ${sub.id}: "${sub.name}" → category_id: ${sub.category_id}`)
      })
    }

    // 3. Сравниваем данные
    console.log('\n3️⃣ Сравнение данных:')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, subs')

    if (catError) {
      console.error('❌ Ошибка при получении categories:', catError)
      return
    }

    categories?.forEach(cat => {
      const realSubs = subcategories?.filter(sub => sub.category_id === cat.id) || []
      const subsFromColumn = cat.subs || []
      
      console.log(`\n📋 Категория "${cat.name}" (ID: ${cat.id}):`)
      console.log(`   В колонке subs: ${JSON.stringify(subsFromColumn)}`)
      console.log(`   В таблице subcategories: ${JSON.stringify(realSubs.map(s => ({ id: s.id, name: s.name })))}`)
      
      if (JSON.stringify(subsFromColumn) !== JSON.stringify(realSubs.map(s => ({ id: s.id, name: s.name })))) {
        console.log(`   ⚠️  РАСХОЖДЕНИЕ!`)
      } else {
        console.log(`   ✅ Данные совпадают`)
      }
    })

    // 4. Проверяем FK constraints
    console.log('\n4️⃣ Проверяем FK constraints:')
    const { data: constraints, error: constError } = await supabase
      .rpc('get_foreign_key_constraints', { table_name: 'subcategories' })

    if (constError) {
      console.log('   ℹ️  Не удалось получить информацию о FK (возможно, функция не существует)')
    } else {
      console.log('   FK constraints:', constraints)
    }

  } catch (error) {
    console.error('❌ Ошибка при диагностике:', error)
  }
}

diagnoseCategories()

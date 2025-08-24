const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {})
    
    Object.keys(envVars).forEach(key => {
      process.env[key] = envVars[key]
    })
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCategoriesStructure() {
  try {
    console.log('🔍 Проверяем структуру таблицы categories...\n')
    
    // Проверяем структуру таблицы categories
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'categories')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnsError) {
      console.error('❌ Ошибка при получении структуры таблицы:', columnsError)
      return
    }
    
    console.log('📋 Структура таблицы categories:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
    })
    
    // Проверяем есть ли поле status
    const hasStatus = columns.some(col => col.column_name === 'status')
    console.log(`\n🔍 Поле 'status' ${hasStatus ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'} в таблице categories`)
    
    if (!hasStatus) {
      console.log('\n⚠️  Нужно добавить поле status в таблицу categories!')
    }
    
    // Показываем несколько записей для примера
    console.log('\n📊 Примеры записей из таблицы categories:')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(3)
    
    if (categoriesError) {
      console.error('❌ Ошибка при получении данных:', categoriesError)
      return
    }
    
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`)
    })
    
  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error)
  }
}

checkCategoriesStructure()

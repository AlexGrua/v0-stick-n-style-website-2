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

async function executeMigrationViaAPI() {
  console.log('🚀 Выполняю миграцию через API...')
  
  try {
    // Читаем SQL файл
    const sqlFile = path.join(__dirname, 'execute-migration-full.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('📝 Отправляю SQL через API...')
    
    // Выполняем через API endpoint
    const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      console.log('Error details:', errorText)
      return
    }
    
    const result = await response.json()
    console.log('✅ Миграция выполнена успешно!')
    console.log('📊 Результат:', result)
    
  } catch (error) {
    console.log('❌ Ошибка выполнения миграции:', error.message)
  }
}

executeMigrationViaAPI()


const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
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
  console.error('❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSupplierStatuses() {
  try {
    console.log('🔧 Исправляем статусы поставщиков...\n')

    // Получаем текущие статусы
    const { data: suppliers, error: fetchError } = await supabase
      .from('suppliers')
      .select('id, name, status')
      .order('id')

    if (fetchError) {
      console.error('❌ Ошибка получения поставщиков:', fetchError)
      return
    }

    console.log('📊 Текущие статусы поставщиков:')
    suppliers.forEach(s => {
      console.log(`   ID ${s.id}: ${s.name} - ${s.status || 'NULL'}`)
    })

    // Обновляем статусы
    const { data: updateResult, error: updateError } = await supabase
      .from('suppliers')
      .update({ status: 'active' })
      .in('status', ['approved', 'pending', 'blocked'])
      .select('id, name, status')

    if (updateError) {
      console.error('❌ Ошибка обновления статусов:', updateError)
      return
    }

    // Обновляем NULL статусы
    const { data: nullUpdateResult, error: nullUpdateError } = await supabase
      .from('suppliers')
      .update({ status: 'active' })
      .is('status', null)
      .select('id, name, status')

    if (nullUpdateError) {
      console.error('❌ Ошибка обновления NULL статусов:', nullUpdateError)
      return
    }

    console.log('\n✅ Статусы обновлены!')
    console.log(`   Обновлено записей: ${(updateResult?.length || 0) + (nullUpdateResult?.length || 0)}`)

    // Проверяем результат
    const { data: finalSuppliers, error: finalError } = await supabase
      .from('suppliers')
      .select('id, name, status')
      .order('id')

    if (finalError) {
      console.error('❌ Ошибка проверки результата:', finalError)
      return
    }

    console.log('\n📊 Финальные статусы поставщиков:')
    finalSuppliers.forEach(s => {
      console.log(`   ID ${s.id}: ${s.name} - ${s.status}`)
    })

    // Уведомляем PostgREST
    const { error: notifyError } = await supabase.rpc('notify_pgrst_reload_schema')
    if (notifyError) {
      console.log('⚠️ Не удалось уведомить PostgREST (это нормально)')
    } else {
      console.log('✅ PostgREST уведомлен об изменениях')
    }

    console.log('\n🎉 Исправление статусов завершено!')

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error)
  }
}

fixSupplierStatuses()

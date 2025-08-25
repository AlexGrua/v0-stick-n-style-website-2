import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Выполняю произвольный SQL...')

    const body = await request.json()
    const { sql } = body

    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'SQL не предоставлен'
      }, { status: 400 })
    }

    console.log('📝 Выполняю SQL:', sql.substring(0, 100) + '...')

    // Выполняем SQL через rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.log('❌ Ошибка выполнения SQL:', error)
      return NextResponse.json({
        success: false,
        error: 'Ошибка выполнения SQL',
        details: error
      }, { status: 500 })
    }

    console.log('✅ SQL выполнен успешно!')

    return NextResponse.json({
      success: true,
      message: 'SQL выполнен успешно!',
      data: data
    })

  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Критическая ошибка при выполнении SQL',
      details: error
    }, { status: 500 })
  }
}


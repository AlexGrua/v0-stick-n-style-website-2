import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    
    console.log('[debug] Checking database schema...')

    // 1. Проверяем search_path
    const { data: searchPath, error: searchPathError } = await supabase.rpc('exec_sql', { 
      sql: 'SHOW search_path;' 
    })
    if (searchPathError) {
      console.error('[debug] Search path error:', searchPathError)
      return NextResponse.json({ error: 'Failed to get search path' }, { status: 500 })
    }

    // 2. Текущая база, пользователь, схема
    const { data: currentInfo, error: currentInfoError } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT current_database(), current_user, current_schema();' 
    })
    if (currentInfoError) {
      console.error('[debug] Current info error:', currentInfoError)
      return NextResponse.json({ error: 'Failed to get current info' }, { status: 500 })
    }

    // 3. Информация о таблицах
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT n.nspname AS schema, c.relname AS table, c.oid
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid=c.relnamespace 
            WHERE c.relname IN ('categories','subcategories');` 
    })
    if (tablesError) {
      console.error('[debug] Tables error:', tablesError)
      return NextResponse.json({ error: 'Failed to get tables info' }, { status: 500 })
    }

    // 4. Последние подкатегории
    const { data: subcategories, error: subcategoriesError } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT id, name, slug, category_id, created_at FROM subcategories ORDER BY id DESC LIMIT 10;' 
    })
    if (subcategoriesError) {
      console.error('[debug] Subcategories error:', subcategoriesError)
      return NextResponse.json({ error: 'Failed to get subcategories' }, { status: 500 })
    }

    // 5. Структура таблицы subcategories
    const { data: subcategoriesStructure, error: structureError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'subcategories' 
            ORDER BY ordinal_position;` 
    })
    if (structureError) {
      console.error('[debug] Structure error:', structureError)
      return NextResponse.json({ error: 'Failed to get table structure' }, { status: 500 })
    }

    // 6. Проверяем последние категории
    const { data: recentCategories, error: categoriesError } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT id, name, slug, created_at FROM categories ORDER BY id DESC LIMIT 5;' 
    })
    if (categoriesError) {
      console.error('[debug] Categories error:', categoriesError)
      return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 })
    }

    const result = {
      searchPath,
      currentInfo,
      tables,
      subcategories,
      subcategoriesStructure,
      recentCategories
    }

    console.log('[debug] Schema check completed successfully')
    return NextResponse.json(result)

  } catch (error) {
    console.error('[debug] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

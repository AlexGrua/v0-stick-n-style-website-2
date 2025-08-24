import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const supabase = createClient()

export async function GET() {
  try {
    // Получаем категории с подкатегориями (unified schema)
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select(`
        id, name, slug, description,
        subcategories(id, name, slug, description)
      `)
      .order("name")

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
      // Fallback данные для категорий (unified schema)
      const fallbackCategories = [
        {
          id: 1,
          name: "Wall Panel",
          slug: "wall-panel",
          subcategories: [
            { id: 1, name: "Plain Color", slug: "plain-color", description: "Plain color wall panels" },
            { id: 2, name: "Brick Structure", slug: "brick-structure", description: "Brick structure wall panels" }
          ]
        }
      ]
      
      const referenceData = {
        categories: fallbackCategories,
        suppliers: [
          { id: 1, name: "ООО \"СтройМатериалы\"", code: "S001" },
          { id: 2, name: "ТД \"Декор Плюс\"", code: "S002" },
          { id: 3, name: "Компания \"ПолПро\"", code: "S003" }
        ]
      }
      
      return NextResponse.json(referenceData)
    }

    // Получаем поставщиков (unified schema)
    const { data: suppliers, error: suppliersError } = await supabase
      .from("suppliers")
      .select("id, name, code, contact_person, email, phone, status")
      .eq("status", "active")
      .order("name")

    if (suppliersError) {
      console.error("Error fetching suppliers:", suppliersError)
      // Fallback данные для поставщиков
      const fallbackSuppliers = [
        { id: 1, name: "ООО \"СтройМатериалы\"", code: "S001" },
        { id: 2, name: "ТД \"Декор Плюс\"", code: "S002" },
        { id: 3, name: "Компания \"ПолПро\"", code: "S003" }
      ]
      
      const referenceData = {
                  categories: categories?.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            subcategories: cat.subs || []
          })) || [],
        suppliers: fallbackSuppliers
      }
      
      return NextResponse.json(referenceData)
    }

            // Формируем справочные данные (unified schema)
        const referenceData = {
          categories: categories?.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            subcategories: cat.subcategories || []
          })) || [],
          suppliers: suppliers?.map((sup: any) => ({
            id: sup.id,
            name: sup.name,
            code: sup.code || `S${sup.id.toString().padStart(3, '0')}`,
            contact_person: sup.contact_person,
            email: sup.email,
            phone: sup.phone,
            status: sup.status
          })) || []
        }

    return NextResponse.json(referenceData)
  } catch (error) {
    console.error("Error in reference data GET:", error)
    // Fallback данные при любой ошибке (unified schema)
    const fallbackData = {
      categories: [
        {
          id: 1,
          name: "Wall Panel",
          slug: "wall-panel",
          description: "Декоративные панели для стен",
          subcategories: [
            { id: 1, name: "Plain Color", slug: "plain-color", description: "Plain color wall panels" },
            { id: 2, name: "Brick Structure", slug: "brick-structure", description: "Brick structure wall panels" }
          ]
        }
      ],
      suppliers: [
        { id: 1, name: "ООО \"СтройМатериалы\"", code: "S001", contact_person: "Иванов И.И.", email: "ivanov@stroymat.ru", phone: "+7-495-123-45-67", status: "active" },
        { id: 2, name: "ТД \"Декор Плюс\"", code: "S002", contact_person: "Петров П.П.", email: "petrov@decorplus.ru", phone: "+7-495-234-56-78", status: "active" },
        { id: 3, name: "Компания \"ПолПро\"", code: "S003", contact_person: "Сидоров С.С.", email: "sidorov@polpro.ru", phone: "+7-495-345-67-89", status: "active" }
      ]
    }
    
    return NextResponse.json(fallbackData)
  }
}

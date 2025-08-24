import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    // Создаем структуру шаблона
    const templateData = [
      {
        // Обязательные поля (будут выделены красным)
        "SKU *": "BK01",
        "Product Name *": "Sample Product",
        "Description *": "Product description",
        "Category Name *": "Wall Panel",
        "Subcategory Name *": "Plain Color",
        "Supplier Code *": "S001",
        "Size *": "70x70",
        "Thickness *": "3mm",
        "Color Name *": "White Matte",
        
        // Необязательные поля
        "Pcs/Box": "25",
        "Box Size (cm)": "120x80x15",
        "Box Volume (m³)": "0.144",
        "Box Weight (kg)": "18.5",
        "Color Image URL": "https://example.com/color.jpg",
        "Additional Photo 1": "https://example.com/photo1.jpg",
        "Additional Photo 2": "https://example.com/photo2.jpg",
        
        // Спецификации продукта
        "Material Description": "High quality material",
        "Usage Description": "Interior decoration",
        "Application Description": "Wall panels",
        "Physical Property": "Durable and lightweight",
        "Adhesion Description": "Strong adhesive properties",
        
        // Интерьерные приложения
        "Interior App Name": "Kitchen",
        "Interior App Description": "Perfect for kitchen walls",
        "Interior App Image": "https://example.com/kitchen.jpg"
      },
      {
        // Вторая строка для демонстрации группировки по SKU
        "SKU *": "BK01",
        "Product Name *": "Sample Product",
        "Description *": "Product description",
        "Category Name *": "Wall Panel",
        "Subcategory Name *": "Plain Color",
        "Supplier Code *": "S001",
        "Size *": "100x100",
        "Thickness *": "5mm",
        "Color Name *": "Black Gloss",
        
        // Разные характеристики для того же SKU
        "Pcs/Box": "15",
        "Box Size (cm)": "150x100x20",
        "Box Volume (m³)": "0.3",
        "Box Weight (kg)": "25.0",
        "Color Image URL": "https://example.com/black.jpg",
        "Additional Photo 1": "",
        "Additional Photo 2": "",
        
        "Material Description": "",
        "Usage Description": "",
        "Application Description": "",
        "Physical Property": "",
        "Adhesion Description": "",
        
        "Interior App Name": "",
        "Interior App Description": "",
        "Interior App Image": ""
      }
    ]

    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // Настраиваем стили для обязательных полей (красный цвет)
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
    
    // Добавляем стили для заголовков обязательных полей
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      const cell = worksheet[cellAddress]
      if (cell && cell.v && typeof cell.v === "string" && cell.v.includes("*")) {
        // Это обязательное поле - делаем красным
        if (!worksheet["!cols"]) worksheet["!cols"] = []
        if (!worksheet["!rows"]) worksheet["!rows"] = []
        
        // Добавляем стиль для заголовка
        if (!cell.s) cell.s = {}
        cell.s.font = { color: { rgb: "FF0000" }, bold: true }
      }
    }

    // Настраиваем ширину колонок
    const columnWidths = [
      { wch: 15 }, // SKU
      { wch: 20 }, // Product Name
      { wch: 30 }, // Description
      { wch: 15 }, // Category Name
      { wch: 15 }, // Subcategory Name
      { wch: 12 }, // Supplier Code
      { wch: 10 }, // Size
      { wch: 8 },  // Thickness
      { wch: 15 }, // Color Name
      { wch: 10 }, // Pcs/Box
      { wch: 15 }, // Box Size
      { wch: 15 }, // Box Volume
      { wch: 15 }, // Box Weight
      { wch: 25 }, // Color Image URL
      { wch: 25 }, // Additional Photo 1
      { wch: 25 }, // Additional Photo 2
      { wch: 25 }, // Material Description
      { wch: 25 }, // Usage Description
      { wch: 25 }, // Application Description
      { wch: 25 }, // Physical Property
      { wch: 25 }, // Adhesion Description
      { wch: 20 }, // Interior App Name
      { wch: 30 }, // Interior App Description
      { wch: 25 }, // Interior App Image
    ]
    
    worksheet["!cols"] = columnWidths

    // Добавляем лист в книгу
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products Template")

    // Создаем инструкции
    const instructionsSheet = XLSX.utils.aoa_to_sheet([
      ["INSTRUCTIONS FOR PRODUCT IMPORT"],
      [""],
      ["REQUIRED FIELDS (marked with *):"],
      ["- SKU: Unique product identifier"],
      ["- Product Name: Name of the product"],
      ["- Description: Product description"],
      ["- Category Name: Name from categories table"],
      ["- Subcategory Name: Name from subcategories table"],
      ["- Supplier Code: Code from suppliers table"],
      ["- Size: Product size (e.g., 70x70)"],
      ["- Thickness: Product thickness (e.g., 3mm)"],
      ["- Color Name: Name of the color variant"],
      [""],
      ["GROUPING BY SKU:"],
      ["- Multiple rows with the same SKU will be grouped into one product"],
      ["- Each row represents different size/thickness/color combination"],
      ["- Technical specifications will be merged for the same SKU"],
      [""],
      ["AVAILABLE CATEGORIES:"],
      ["- Wall Panel"],
      [""],
      ["AVAILABLE SUBCATEGORIES:"],
      ["- Plain Color"],
      ["- Brick Structure"],
      [""],
      ["AVAILABLE SUPPLIER CODES:"],
      ["- S001: ООО \"СтройМатериалы\""],
      ["- S002: ТД \"Декор Плюс\""],
      ["- S003: Компания \"ПолПро\""],
      [""],
      ["IMPORTANT NOTES:"],
      ["- All imported products will be set to 'inactive' by default"],
      ["- Images are optional (placeholder will be used if not provided)"],
      ["- Leave empty fields if not applicable"],
      ["- SKU must be unique across all products"],
      ["- Use exact names for categories and subcategories"],
      ["- Use exact supplier codes"],
      [""],
      ["REFERENCE SHEETS:"],
      ["- Sheet 2 'Suppliers Info': List of all available suppliers with codes"],
      ["- Sheet 3 'Categories Info': List of all available categories and subcategories"],
      ["- Copy exact values from reference sheets to avoid errors"]
    ])

    // Настраиваем ширину для инструкций
    instructionsSheet["!cols"] = [{ wch: 50 }]
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions")

    // Получаем справочные данные для листов 2 и 3
    let referenceData = { suppliers: [], categories: [] }
    try {
      const referenceResponse = await fetch(`${request.nextUrl.origin}/api/products/import/reference`)
      if (referenceResponse.ok) {
        referenceData = await referenceResponse.json()
      } else {
        console.warn("[v0] Failed to fetch reference data, using fallback")
        // Fallback данные
        referenceData = {
          suppliers: [
            { id: 1, code: "S001", name: "ООО \"СтройМатериалы\"", contactPerson: "Иванов Иван", contactEmail: "info@stroymaterials.ru", contactPhone: "+7 (495) 123-45-67", status: "active" },
            { id: 2, code: "S002", name: "ТД \"Декор Плюс\"", contactPerson: "Петрова Анна", contactEmail: "sales@decorplus.ru", contactPhone: "+7 (812) 987-65-43", status: "active" },
            { id: 3, code: "S003", name: "Компания \"ПолПро\"", contactPerson: "Сидоров Петр", contactEmail: "order@polpro.ru", contactPhone: "+7 (495) 555-12-34", status: "active" }
          ],
          categories: [
            {
              id: 4,
              name: "Wall Panel",
              subcategories: [
                { id: "6ed96566-6a11-4f09-b5e5-bd4c5cc6a096", name: "Plain Color", description: "Plain color wall panels" },
                { id: "7ed96566-6a11-4f09-b5e5-bd4c5cc6a097", name: "Brick Structure", description: "Brick structure wall panels" }
              ]
            }
          ]
        }
      }
    } catch (error) {
      console.warn("[v0] Error fetching reference data:", error)
      // Fallback данные
      referenceData = {
        suppliers: [
          { id: 1, code: "S001", name: "ООО \"СтройМатериалы\"", contactPerson: "Иванов Иван", contactEmail: "info@stroymaterials.ru", contactPhone: "+7 (495) 123-45-67", status: "active" },
          { id: 2, code: "S002", name: "ТД \"Декор Плюс\"", contactPerson: "Петрова Анна", contactEmail: "sales@decorplus.ru", contactPhone: "+7 (812) 987-65-43", status: "active" },
          { id: 3, code: "S003", name: "Компания \"ПолПро\"", contactPerson: "Сидоров Петр", contactEmail: "order@polpro.ru", contactPhone: "+7 (495) 555-12-34", status: "active" }
        ],
        categories: [
          {
            id: 4,
            name: "Wall Panel",
            subcategories: [
              { id: "6ed96566-6a11-4f09-b5e5-bd4c5cc6a096", name: "Plain Color", description: "Plain color wall panels" },
              { id: "7ed96566-6a11-4f09-b5e5-bd4c5cc6a097", name: "Brick Structure", description: "Brick structure wall panels" }
            ]
          }
        ]
      }
    }

    // Создаем лист 2: Suppliers Info
    const suppliersData = referenceData.suppliers.map((supplier: any) => ({
      "ID": supplier.id,
      "Code": supplier.code,
      "Name": supplier.name,
      "Contact Person": supplier.contactPerson || "",
      "Email": supplier.contactEmail || "",
      "Phone": supplier.contactPhone || "",
      "Status": supplier.status || "active"
    }))

    const suppliersSheet = XLSX.utils.json_to_sheet(suppliersData)
    suppliersSheet["!cols"] = [
      { wch: 8 },  // ID
      { wch: 12 }, // Code
      { wch: 30 }, // Name
      { wch: 20 }, // Contact Person
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Status
    ]
    XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Suppliers Info")

    // Создаем лист 3: Categories Info
    const categoriesData: any[] = []
    referenceData.categories.forEach((category: any) => {
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach((sub: any) => {
          categoriesData.push({
            "Category Name": category.name,
            "Subcategory Name": sub.name,
            "Category ID": category.id,
            "Subcategory ID": sub.id,
            "Description": sub.description || ""
          })
        })
      } else {
        categoriesData.push({
          "Category Name": category.name,
          "Subcategory Name": "",
          "Category ID": category.id,
          "Subcategory ID": "",
          "Description": ""
        })
      }
    })

    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData)
    categoriesSheet["!cols"] = [
      { wch: 20 }, // Category Name
      { wch: 20 }, // Subcategory Name
      { wch: 12 }, // Category ID
      { wch: 15 }, // Subcategory ID
      { wch: 30 }, // Description
    ]
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories Info")

    // Генерируем буфер
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Возвращаем файл
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=products-import-template.xlsx",
      },
    })
  } catch (error) {
    console.error("[v0] Error generating template:", error)
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}

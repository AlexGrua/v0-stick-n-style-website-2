"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Table, FileText, Package, Tag, RefreshCw } from "lucide-react"

interface TableInfo {
  name: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
  }>
  rowCount: number
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTableInfo = async () => {
    try {
      setRefreshing(true)
      // Здесь будет API для получения информации о таблицах
      const mockTables: TableInfo[] = [
        {
          name: "home_page_data",
          columns: [
            { name: "id", type: "integer", nullable: false },
            { name: "data", type: "jsonb", nullable: false },
            { name: "updated_at", type: "timestamp", nullable: false },
          ],
          rowCount: 1,
        },
        {
          name: "categories",
          columns: [
            { name: "id", type: "integer", nullable: false },
            { name: "name", type: "varchar", nullable: false },
            { name: "slug", type: "varchar", nullable: false },
            { name: "description", type: "text", nullable: true },
            { name: "image_url", type: "text", nullable: true },
            { name: "created_at", type: "timestamp", nullable: false },
            { name: "updated_at", type: "timestamp", nullable: false },
          ],
          rowCount: 0,
        },
        {
          name: "products",
          columns: [
            { name: "id", type: "integer", nullable: false },
            { name: "name", type: "varchar", nullable: false },
            { name: "slug", type: "varchar", nullable: false },
            { name: "description", type: "text", nullable: true },
            { name: "price", type: "numeric", nullable: false },
            { name: "category_id", type: "integer", nullable: false },
            { name: "image_url", type: "text", nullable: true },
            { name: "images", type: "jsonb", nullable: true },
            { name: "specifications", type: "jsonb", nullable: true },
            { name: "in_stock", type: "boolean", nullable: false },
            { name: "created_at", type: "timestamp", nullable: false },
            { name: "updated_at", type: "timestamp", nullable: false },
          ],
          rowCount: 0,
        },
      ]
      setTables(mockTables)
    } catch (error) {
      console.error("Error fetching table info:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTableInfo()
  }, [])

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "home_page_data":
        return <FileText className="h-5 w-5" />
      case "categories":
        return <Tag className="h-5 w-5" />
      case "products":
        return <Package className="h-5 w-5" />
      default:
        return <Table className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    if (type.includes("integer")) return "bg-blue-100 text-blue-800"
    if (type.includes("varchar") || type.includes("text")) return "bg-green-100 text-green-800"
    if (type.includes("jsonb")) return "bg-purple-100 text-purple-800"
    if (type.includes("timestamp")) return "bg-orange-100 text-orange-800"
    if (type.includes("boolean")) return "bg-red-100 text-red-800"
    if (type.includes("numeric")) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">База данных</h1>
          <p className="text-muted-foreground">Структура и содержимое базы данных Supabase</p>
        </div>
        <Button onClick={fetchTableInfo} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего таблиц</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.reduce((sum, table) => sum + table.rowCount, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Активна</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="structure">Структура</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {tables.map((table) => (
              <Card key={table.name}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {getTableIcon(table.name)}
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    <Badge variant="secondary">{table.rowCount} записей</Badge>
                  </div>
                  <CardDescription>{table.columns.length} колонок</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {table.columns.slice(0, 5).map((column) => (
                      <Badge key={column.name} variant="outline" className={getTypeColor(column.type)}>
                        {column.name}: {column.type}
                      </Badge>
                    ))}
                    {table.columns.length > 5 && <Badge variant="outline">+{table.columns.length - 5} еще</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          {tables.map((table) => (
            <Card key={table.name}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  {getTableIcon(table.name)}
                  <CardTitle>{table.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {table.columns.map((column) => (
                    <div key={column.name} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{column.name}</span>
                        {!column.nullable && (
                          <Badge variant="destructive" className="text-xs">
                            NOT NULL
                          </Badge>
                        )}
                      </div>
                      <Badge className={getTypeColor(column.type)}>{column.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

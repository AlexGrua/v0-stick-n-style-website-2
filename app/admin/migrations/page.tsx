'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function MigrationsPage() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const executeMigration = async () => {
    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      console.log('🚀 Выполняю миграцию 001...')
      
      const response = await fetch('/api/migrations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        console.log('✅ Миграция выполнена успешно:', data)
      } else {
        setError(data.error || 'Неизвестная ошибка')
        console.error('❌ Ошибка миграции:', data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка выполнения')
      console.error('❌ Критическая ошибка:', err)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Миграции базы данных</h1>
          <p className="text-muted-foreground">
            Управление схемой базы данных и миграциями
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Миграция 001 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Миграция 001: Добавление недостающих колонок
                  <Badge variant="outline">Готов к выполнению</Badge>
                </CardTitle>
                <CardDescription>
                  Добавляет колонки sku, subcategory_id, specifications в products и создает таблицу subcategories
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold mb-2">Что делает миграция:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Добавляет колонку <code>sku TEXT</code> в таблицу products</li>
                  <li>Добавляет колонку <code>subcategory_id INTEGER</code> в таблицу products</li>
                  <li>Добавляет колонку <code>specifications JSONB</code> в таблицу products</li>
                  <li>Создает таблицу <code>subcategories</code> с FK на categories</li>
                  <li>Создает FK связь products.subcategory_id → subcategories.id</li>
                  <li>Создает индексы для производительности</li>
                  <li>Временно отключает RLS для админки</li>
                  <li>Добавляет демо-данные для тестирования</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ожидаемый результат:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>✅ Исчезнут ошибки FK связей в логах</li>
                  <li>✅ API будет работать без ошибок</li>
                  <li>✅ Импорт продуктов будет функционировать</li>
                  <li>✅ Появятся новые колонки в админке</li>
                </ul>
              </div>

              <Button 
                onClick={executeMigration} 
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Выполняю миграцию...
                  </>
                ) : (
                  'Выполнить миграцию 001'
                )}
              </Button>
            </div>

            {/* Результат выполнения */}
            {result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold mb-2">✅ Миграция выполнена успешно!</div>
                  <div className="text-sm space-y-1">
                    <div>• {result.message}</div>
                    {result.verification && (
                      <div className="mt-2">
                        <div className="font-medium">Результаты проверки:</div>
                        <div className="text-xs space-y-1 mt-1">
                          {result.verification.map((check: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              {check.error ? (
                                <XCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                              <span>Проверка {index + 1}: {check.error ? 'Ошибка' : 'Успех'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-semibold mb-2">❌ Ошибка выполнения миграции</div>
                  <div className="text-sm">{error}</div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Инструкции */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Важные замечания
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="font-semibold text-yellow-800 mb-1">⚠️ RLS временно отключен</div>
                <div className="text-yellow-700">
                  После выполнения миграции RLS отключен для админки. 
                  См. план включения RLS в <code>scripts/migrations/RLS-PRODUCTION-PLAN.md</code>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="font-semibold text-blue-800 mb-1">ℹ️ Следующие шаги</div>
                <div className="text-blue-700">
                  После успешного выполнения миграции:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Проверьте админку - ошибки FK должны исчезнуть</li>
                    <li>Протестируйте импорт продуктов</li>
                    <li>Планируйте включение RLS для production</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

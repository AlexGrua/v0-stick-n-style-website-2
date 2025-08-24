"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Copy, Trash2, Search, Eye, Plus } from "lucide-react"

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, item: any) => React.ReactNode
  className?: string
}

export interface TableAction {
  key: string
  label: string | ((item: any) => string)
  icon?: React.ReactNode | ((item: any) => React.ReactNode)
  onClick: (item: any) => void | Promise<void>
  variant?: "default" | "destructive" | "secondary"
}

interface UnifiedTableProps {
  data: any[]
  columns: TableColumn[]
  actions: TableAction[]
  total: number
  loading: boolean
  searchPlaceholder?: string
  onSearch?: (search: string) => void
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  onAdd?: () => void
  addButtonLabel?: string
  emptyMessage?: string
  loadingMessage?: string
}

export function UnifiedTable({
  data,
  columns,
  actions,
  total,
  loading,
  searchPlaceholder = "Search...",
  onSearch,
  onSort,
  sortField,
  sortDirection,
  onAdd,
  addButtonLabel = "Add New",
  emptyMessage = "No items found",
  loadingMessage = "Loading..."
}: UnifiedTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const handleSort = (field: string) => {
    if (!onSort) return
    
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(field, newDirection)
  }

  const handleAction = async (action: TableAction, item: any) => {
    try {
      await action.onClick(item)
    } catch (error) {
      console.error(`Error in action ${action.key}:`, error)
      // Перебрасываем ошибку в родительский компонент
      throw error
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? "↑" : "↓"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">{loadingMessage}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {data.length} of {total} items
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={`${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''} ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action) => (
                          <DropdownMenuItem 
                            key={action.key}
                            onClick={async () => {
                              try {
                                await handleAction(action, item)
                              } catch (error) {
                                // Ошибка уже обработана в родительском компоненте
                                // Просто логируем для отладки
                                console.error('Action failed in UnifiedTable:', error)
                              }
                            }}
                            className={action.variant === 'destructive' ? 'text-red-600' : ''}
                          >
                            {action.icon ? (typeof action.icon === 'function' ? action.icon(item) : action.icon) : null}
                            {typeof action.label === 'function' ? action.label(item) : action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

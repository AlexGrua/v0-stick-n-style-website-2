import { serverGetAllUsers } from './auth-storage-server'

export interface AuditLog {
  id: string
  userId: string
  userRole: string
  userEmail: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'LOGIN' | 'LOGOUT' | 'ROLE_CHANGE' | 'PERMISSION_CHANGE'
  entity: 'user' | 'product' | 'category' | 'setting' | 'page' | 'supplier' | 'order'
  entityId?: string
  entityName?: string
  changes?: { before?: any, after?: any }
  ip?: string
  userAgent?: string
  timestamp: Date
  success: boolean
  error?: string
  details?: string
}

// In-memory storage for development (replace with file/database in production)
let auditLogs: AuditLog[] = []

// Load logs from file if exists
try {
  const fs = require('fs')
  const path = require('path')
  const logFile = path.join(process.cwd(), 'data', 'audit-logs.json')
  
  if (fs.existsSync(logFile)) {
    const data = fs.readFileSync(logFile, 'utf8')
    auditLogs = JSON.parse(data)
  }
} catch (error) {
  console.log('No existing audit logs found, starting fresh')
}

function saveLogsToFile() {
  try {
    const fs = require('fs')
    const path = require('path')
    const dataDir = path.join(process.cwd(), 'data')
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const logFile = path.join(dataDir, 'audit-logs.json')
    fs.writeFileSync(logFile, JSON.stringify(auditLogs, null, 2))
  } catch (error) {
    console.error('Failed to save audit logs:', error)
  }
}

export async function logAction(
  userId: string,
  action: AuditLog['action'],
  entity: AuditLog['entity'],
  options: {
    entityId?: string
    entityName?: string
    changes?: { before?: any, after?: any }
    ip?: string
    userAgent?: string
    success?: boolean
    error?: string
    details?: string
  } = {}
): Promise<void> {
  try {
    // Get user info
    const users = serverGetAllUsers()
    const user = users.find(u => u.id === userId)
    
    // Create log even if user not found (for system actions)
    const log: AuditLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      userRole: user?.role || 'unknown',
      userEmail: user?.email || 'unknown@example.com',
      action,
      entity,
      entityId: options.entityId,
      entityName: options.entityName,
      changes: options.changes,
      ip: options.ip,
      userAgent: options.userAgent,
      timestamp: new Date(),
      success: options.success ?? true,
      error: options.error,
      details: options.details
    }

    auditLogs.push(log)
    
    // Keep only last 1000 logs to prevent memory issues
    if (auditLogs.length > 1000) {
      auditLogs = auditLogs.slice(-1000)
    }
    
    saveLogsToFile()
    
    // Console log for development
    console.log(`[AUDIT] ${log.userEmail} (${log.userRole}) ${action} ${entity}${options.entityName ? `: ${options.entityName}` : ''}`)
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export function getAuditLogs(
  filters?: {
    userId?: string
    action?: AuditLog['action']
    entity?: AuditLog['entity']
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): AuditLog[] {
  let filteredLogs = [...auditLogs]

  if (filters?.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
  }
  
  if (filters?.action) {
    filteredLogs = filteredLogs.filter(log => log.action === filters.action)
  }
  
  if (filters?.entity) {
    filteredLogs = filteredLogs.filter(log => log.entity === filters.entity)
  }
  
  if (filters?.startDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!)
  }
  
  if (filters?.endDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!)
  }

  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (filters?.limit) {
    filteredLogs = filteredLogs.slice(0, filters.limit)
  }

  return filteredLogs
}

export function clearAuditLogs(): void {
  auditLogs = []
  saveLogsToFile()
}

// Helper functions for common actions
export const auditLogger = {
  userCreated: (userId: string, targetUserId: string, targetUserEmail: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'CREATE', 'user', { entityId: targetUserId, entityName: targetUserEmail, ip, userAgent }),
    
  userUpdated: (userId: string, targetUserId: string, targetUserEmail: string, changes: any, ip?: string, userAgent?: string) =>
    logAction(userId, 'UPDATE', 'user', { entityId: targetUserId, entityName: targetUserEmail, changes, ip, userAgent }),
    
  userDeleted: (userId: string, targetUserId: string, targetUserEmail: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'DELETE', 'user', { entityId: targetUserId, entityName: targetUserEmail, ip, userAgent }),
    
  roleChanged: (userId: string, targetUserId: string, targetUserEmail: string, changes: any, ip?: string, userAgent?: string) =>
    logAction(userId, 'ROLE_CHANGE', 'user', { entityId: targetUserId, entityName: targetUserEmail, changes, ip, userAgent }),
    
  permissionsChanged: (userId: string, targetUserId: string, targetUserEmail: string, changes: any, ip?: string, userAgent?: string) =>
    logAction(userId, 'PERMISSION_CHANGE', 'user', { entityId: targetUserId, entityName: targetUserEmail, changes, ip, userAgent }),
    
  userLogin: (userId: string, userEmail: string, success: boolean, error?: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'LOGIN', 'user', { entityName: userEmail, success, error, ip, userAgent }),
    
  userLogout: (userId: string, userEmail: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'LOGOUT', 'user', { entityName: userEmail, ip, userAgent }),
    
  productCreated: (userId: string, productId: string, productName: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'CREATE', 'product', { entityId: productId, entityName: productName, ip, userAgent }),
    
  productUpdated: (userId: string, productId: string, productName: string, changes: any, ip?: string, userAgent?: string) =>
    logAction(userId, 'UPDATE', 'product', { entityId: productId, entityName: productName, changes, ip, userAgent }),
    
  productDeleted: (userId: string, productId: string, productName: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'DELETE', 'product', { entityId: productId, entityName: productName, ip, userAgent }),
    
  categoryCreated: (userId: string, categoryId: string, categoryName: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'CREATE', 'category', { entityId: categoryId, entityName: categoryName, ip, userAgent }),
    
  categoryUpdated: (userId: string, categoryId: string, categoryName: string, changes: any, ip?: string, userAgent?: string) =>
    logAction(userId, 'UPDATE', 'category', { entityId: categoryId, entityName: categoryName, changes, ip, userAgent }),
    
  categoryDeleted: (userId: string, categoryId: string, categoryName: string, ip?: string, userAgent?: string) =>
    logAction(userId, 'DELETE', 'category', { entityId: categoryId, entityName: categoryName, ip, userAgent }),
    
  settingChanged: (userId: string, settingKey: string, changes: any, ip?: string, userAgent?: string) =>
    logAction(userId, 'UPDATE', 'setting', { entityId: settingKey, entityName: settingKey, changes, ip, userAgent })
}

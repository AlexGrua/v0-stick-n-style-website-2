export const allowedTypesByPage: Record<string, string[]> = {
  home: ['hero', 'features', 'productGrid', 'cooperation'],
  contact: ['contactsHero', 'contactFormBlock', 'contactChannels'],
  about: ['aboutHero', 'orderProcess', 'teamGrid', 'stats', 'gallery'],
}

export function getAllowedTypes(pageKey: string): string[] {
  return allowedTypesByPage[pageKey] || []
}

export function isTypeAllowed(pageKey: string, blockType: string): boolean {
  const allowed = getAllowedTypes(pageKey)
  return allowed.includes(blockType)
}


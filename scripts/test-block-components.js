// Простой тест для проверки компонентов блоков
console.log('🧪 Testing block components...')

// Имитируем данные блоков
const testBlocks = [
  {
    id: 1,
    type: 'contactsHero',
    props: {
      title: 'Contact Us',
      subtitle: 'Tell us about your project or request a quote.'
    }
  },
  {
    id: 2,
    type: 'contactFormBlock',
    props: {
      title: '',
      subtitle: '',
      description: ''
    }
  },
  {
    id: 3,
    type: 'contactChannels',
    props: {
      items: [
        {
          iconKey: 'email',
          label: 'Email',
          value: 'hello@sticknstyle.com',
          href: 'mailto:hello@sticknstyle.com',
          visible: true
        },
        {
          iconKey: 'phone',
          label: 'Phone',
          value: '+86 123 456 789',
          href: 'tel:+86123456789',
          visible: true
        }
      ]
    }
  }
]

// Проверяем BlockRegistry
try {
  const { BlockRegistry } = require('../lib/blocks/registry.ts')
  console.log('✅ BlockRegistry loaded successfully')
  console.log('📦 Available block types:', Object.keys(BlockRegistry))
  
  // Проверяем каждый блок
  testBlocks.forEach((block, index) => {
    console.log(`\n${index + 1}. Testing block: ${block.type}`)
    
    if (BlockRegistry[block.type]) {
      console.log(`   ✅ Block type found in registry`)
      console.log(`   📋 Component:`, typeof BlockRegistry[block.type].component)
      console.log(`   📋 Schema:`, typeof BlockRegistry[block.type].schema)
    } else {
      console.log(`   ❌ Block type NOT found in registry`)
    }
  })
  
} catch (error) {
  console.log('❌ Failed to load BlockRegistry:', error.message)
}

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Загружаем переменные окружения из .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function backfillContactsBlocks() {
  console.log('Starting Contact blocks backfill...')

  try {
    // 1. Create or get the 'contact' page
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .upsert({ key: 'contact' }, { onConflict: 'key' })
      .select()
      .single()

    if (pageError) {
      throw new Error(`Failed to create/get contact page: ${pageError.message}`)
    }

    console.log('✅ Contact page ready:', page.key)

    // 2. Create contactsHero block
    const contactsHeroBlock = {
      page_id: page.id,
      type: 'contactsHero',
      props: {
        title: 'Contact Us',
        subtitle: 'Tell us about your project or request a quote.'
      },
      slot: 'main',
      position: 0,
      is_active: true,
      version: 1
    }

    const { error: heroError } = await supabase
      .from('page_blocks')
      .upsert(contactsHeroBlock, { onConflict: 'page_id,position' })

    if (heroError) {
      throw new Error(`Failed to create contactsHero block: ${heroError.message}`)
    }

    console.log('✅ contactsHero block created')

    // 3. Create contactFormBlock
    const contactFormBlock = {
      page_id: page.id,
      type: 'contactFormBlock',
      props: {
        title: '',
        subtitle: '',
        description: ''
      },
      slot: 'main',
      position: 1,
      is_active: true,
      version: 1
    }

    const { error: formError } = await supabase
      .from('page_blocks')
      .upsert(contactFormBlock, { onConflict: 'page_id,position' })

    if (formError) {
      throw new Error(`Failed to create contactFormBlock: ${formError.message}`)
    }

    console.log('✅ contactFormBlock created')

    // 4. Create contactChannels block
    const contactChannelsBlock = {
      page_id: page.id,
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
          },
          {
            iconKey: 'whatsapp',
            label: 'WhatsApp',
            value: 'WhatsApp',
            visible: true
          },
          {
            iconKey: 'telegram',
            label: 'Telegram',
            value: 'Telegram',
            visible: true
          }
        ]
      },
      slot: 'main',
      position: 2,
      is_active: true,
      version: 1
    }

    const { error: channelsError } = await supabase
      .from('page_blocks')
      .upsert(contactChannelsBlock, { onConflict: 'page_id,position' })

    if (channelsError) {
      throw new Error(`Failed to create contactChannels block: ${channelsError.message}`)
    }

    console.log('✅ contactChannels block created')

    // 5. Deactivate any existing map/placeholder blocks
    const { error: deactivateError } = await supabase
      .from('page_blocks')
      .update({ is_active: false })
      .eq('page_id', page.id)
      .in('type', ['map'])

    if (deactivateError) {
      console.warn('⚠️ Warning: Could not deactivate map blocks:', deactivateError.message)
    } else {
      console.log('✅ Map blocks deactivated')
    }

    // 6. Create initial publication
    const { data: blocks } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_id', page.id)
      .eq('is_active', true)
      .order('position')

    if (blocks && blocks.length > 0) {
      const { error: pubError } = await supabase
        .from('page_publications')
        .insert({
          page_id: page.id,
          version: 1,
          snapshot: blocks.map(b => ({ id: b.id, type: b.type, props: b.props })),
          published_by: 'system'
        })

      if (pubError) {
        console.warn('⚠️ Warning: Could not create publication:', pubError.message)
      } else {
        console.log('✅ Initial publication created')
      }
    }

    console.log('🎉 Contact blocks backfill completed successfully!')
    console.log(`📊 Created ${blocks?.length || 0} blocks for page 'contact'`)

  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  backfillContactsBlocks()
}

module.exports = { backfillContactsBlocks }


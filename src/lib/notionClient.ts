'use server'

import { Client } from '@notionhq/client'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const databaseId = process.env.NOTION_NOTES_DATABASE_ID

// Type definitions
export type Note = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// Helper function to check if a page is a full page object
function isFullPage(page: any): boolean {
  return page && 'properties' in page
}

// Get all notes
export async function getNotes() {
  try {
    if (!databaseId) {
      throw new Error('Notion database ID not found')
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
    })

    const notes = response.results.filter(isFullPage).map((page: any) => {
      // Handle title property
      const titleProperty = page.properties.title
      let titleText = 'Untitled'
      if (titleProperty.type === 'rich_text' && titleProperty.rich_text.length > 0) {
        titleText = titleProperty.rich_text[0]?.plain_text || 'Untitled'
      }

      // Handle content property
      const contentProperty = page.properties.content
      let contentText = ''
      if (contentProperty.type === 'rich_text' && contentProperty.rich_text.length > 0) {
        contentText = contentProperty.rich_text[0]?.plain_text || ''
      }

      return {
        id: page.id,
        title: titleText,
        content: contentText,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
      }
    })

    return {
      isSuccess: true,
      data: notes,
    }
  } catch (err) {
    console.error('Error fetching notes from Notion:', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}

// Get a single note by ID
export async function getNote(noteId: string) {
  try {
    const response = await notion.pages.retrieve({
      page_id: noteId,
    })

    // Cast response to any to access properties
    const page = response as any

    const note = {
      id: page.id,
      title: page.properties.title.rich_text[0]?.plain_text || 'Untitled',
      content: page.properties.content.rich_text[0]?.plain_text || '',
      createdAt: page.created_time,
      updatedAt: page.last_edited_time,
    }

    return {
      isSuccess: true,
      data: note,
    }
  } catch (err) {
    console.error('Error fetching note from Notion:', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}

// Create a new note
export async function createNote(title: string, content: string) {
  try {
    if (!databaseId) {
      throw new Error('Notion database ID not found')
    }

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        title: {
          rich_text: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        content: {
          rich_text: [
            {
              text: {
                content: content,
              },
            },
          ],
        },
      },
    })

    // Cast response to any to access properties
    const page = response as any

    return {
      isSuccess: true,
      data: {
        id: page.id,
        title,
        content,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
      },
    }
  } catch (err) {
    console.error('Error creating note in Notion:', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}

// Update an existing note
export async function updateNote(noteId: string, title: string, content: string) {
  try {
    const response = await notion.pages.update({
      page_id: noteId,
      properties: {
        title: {
          rich_text: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        content: {
          rich_text: [
            {
              text: {
                content: content,
              },
            },
          ],
        },
      },
    })

    // Cast response to any to access properties
    const page = response as any

    return {
      isSuccess: true,
      data: {
        id: page.id,
        title,
        content,
        updatedAt: page.last_edited_time,
      },
    }
  } catch (err) {
    console.error('Error updating note in Notion:', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}

// Delete a note
export async function deleteNote(noteId: string) {
  try {
    await notion.pages.update({
      page_id: noteId,
      archived: true,
    })

    return {
      isSuccess: true,
      data: { id: noteId },
    }
  } catch (err) {
    console.error('Error deleting note from Notion:', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}

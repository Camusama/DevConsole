# Notes Feature Setup Guide

This document provides instructions for setting up the Notes feature with Notion database integration.

## Required Dependencies

Install the following dependencies:

```bash
pnpm add react-simplemde-editor easymde @notionhq/client
```

## Notion API Setup

1. Create a Notion integration:

   - Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Name your integration (e.g., "DevConsole Notes")
   - Select the workspace where you want to use the integration
   - Click "Submit"
   - Copy the "Internal Integration Token" (this will be your `NOTION_API_KEY`)

2. Create a database in Notion:
   - Create a new page in Notion
   - Add a database (full page or inline)
   - Add the following properties to your database:
     - `title` (Title type) - This will store the note title
     - `content` (Text type) - This will store the note content
   - Copy the database ID from the URL (it's the part after the workspace name and before the question mark)
     - Example: `https://www.notion.so/workspace/1234567890abcdef1234567890abcdef?v=...`
     - Database ID: `1234567890abcdef1234567890abcdef`
3. Share the database with your integration:
   - Open the database in Notion
   - Click "Share" in the top right
   - Click "Invite"
   - Search for your integration name and select it
   - Click "Invite"

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
NOTION_API_KEY=your_notion_api_key
NOTION_NOTES_DATABASE_ID=your_notion_database_id
```

## CSS for SimpleMDE Editor

Make sure to import the SimpleMDE CSS in your project. You can either:

1. Add it to your `layout.tsx` file:

```tsx
import 'easymde/dist/easymde.min.css'
```

2. Or add it to your global CSS file:

```css
@import 'easymde/dist/easymde.min.css';
```

## Usage

The Notes feature provides the following functionality:

- View a list of all notes
- Create new notes
- Edit existing notes
- Delete notes
- Search notes by title or content
- Markdown editing with preview

All notes are stored in your Notion database and can be accessed and edited from both the DevConsole and Notion.

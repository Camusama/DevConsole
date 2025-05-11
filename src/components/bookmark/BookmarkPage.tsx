'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

import BookmarkCard, { Bookmark } from './BookmarkCard'
import BookmarkForm from './BookmarkForm'
import DraggableCategory from './DraggableCategory'

// Default bookmark
const defaultBookMark = {
  title: '',
  url: '',
  category: '默认',
  description: '',
}

// Props for the BookmarkPage component
type BookmarkPageProps = {
  title?: string
  collectionName?: string
  apiEndpoint?: string
}

// BookmarkPage component
const BookmarkPage = ({
  title = '书签管理',
  collectionName = 'bookmarks',
  apiEndpoint = '/api/bookmarks',
}: BookmarkPageProps) => {
  // API fetcher functions
  const fetchBookmarksApi = async () => {
    const response = await fetch(`${apiEndpoint}?collection=${collectionName}`)
    if (!response.ok) {
      throw new Error('获取数据失败')
    }
    const data = await response.json()
    return data.bookmarks || []
  }

  const fetchCategoryOrderApi = async () => {
    const response = await fetch(`/api/category-order?collection=${collectionName}`)
    if (!response.ok) {
      throw new Error('获取分类顺序失败')
    }
    const data = await response.json()
    return data.categoryOrder || []
  }

  const saveCategoryOrderApi = async (order: string[]) => {
    const response = await fetch('/api/category-order', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order, collectionName }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '保存分类顺序失败')
    }

    return await response.json()
  }

  const saveBookmarkApi = async (bookmark: Bookmark | Bookmark[]) => {
    // If it's a single bookmark with ID, it's an update operation
    const isUpdate = !Array.isArray(bookmark) && bookmark._id
    const method = isUpdate ? 'PUT' : 'POST'

    const response = await fetch(apiEndpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...bookmark,
        collection: collectionName
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '操作失败')
    }

    return await response.json()
  }

  const deleteBookmarkApi = async (id: string) => {
    const response = await fetch(`${apiEndpoint}?id=${id}&collection=${collectionName}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '删除失败')
    }

    return await response.json()
  }

  // Use SWR for data fetching
  const {
    data: bookmarks = [],
    isLoading,
    mutate: refreshBookmarks,
  } = useSWR<Bookmark[]>(`${apiEndpoint}?collection=${collectionName}`, fetchBookmarksApi, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10 seconds
  })

  // Use SWR for category order
  const {
    data: savedCategoryOrder = [],
    mutate: refreshCategoryOrder,
  } = useSWR<string[]>(`/api/category-order?collection=${collectionName}`, fetchCategoryOrderApi, {
    revalidateOnFocus: false,
  })

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark>({ ...defaultBookMark })
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])

  // Extract categories from bookmarks
  const allCategories = Array.from(new Set(bookmarks.map(bookmark => bookmark.category)))

  // Update category order when bookmarks or saved order changes
  useEffect(() => {
    if (savedCategoryOrder.length > 0) {
      // Filter out categories that no longer exist
      const validSavedCategories = savedCategoryOrder.filter(cat => allCategories.includes(cat))
      
      // Add any new categories that aren't in the saved order
      const newCategories = allCategories.filter(cat => !savedCategoryOrder.includes(cat))
      
      setCategoryOrder([...validSavedCategories, ...newCategories])
    } else {
      setCategoryOrder(allCategories)
    }
  }, [allCategories, savedCategoryOrder])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setCategoryOrder(currentOrder => {
        const oldIndex = currentOrder.indexOf(active.id.toString())
        const newIndex = currentOrder.indexOf(over.id.toString())
        
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
        
        // Save the new order to the server
        toast.promise(saveCategoryOrderApi(newOrder), {
          loading: '保存分类顺序...',
          success: '分类顺序已更新',
          error: '保存分类顺序失败',
        })
        
        return newOrder
      })
    }
  }

  // Sheet open/close handler
  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setEditMode(false)
      setCurrentBookmark({ ...defaultBookMark })
    }
    setSheetOpen(open)
  }

  // Add or update bookmark
  const saveBookmark = async () => {
    try {
      if (!currentBookmark.title || !currentBookmark.url) {
        toast.error('标题和URL是必填项')
        return
      }

      // If in edit mode or URL doesn't contain line breaks, handle as single bookmark
      if (editMode || !currentBookmark.url.includes('\n')) {
        toast.promise(saveBookmarkApi(currentBookmark), {
          loading: '保存中...',
          success: () => {
            setCurrentBookmark({ ...defaultBookMark })
            setEditMode(false)
            setSheetOpen(false)
            refreshBookmarks() // Refresh data
            return currentBookmark._id ? '书签更新成功' : '书签添加成功'
          },
          error: err => `${err.message}`,
        })
      } else {
        // Batch add mode
        const urls = currentBookmark.url.split('\n').filter(url => url.trim() !== '')

        if (urls.length === 0) {
          toast.error('请输入至少一个有效的URL')
          return
        }

        // Create batch bookmarks array
        const bookmarks = urls.map(url => ({
          title: currentBookmark.title,
          url: url.trim(),
          category: currentBookmark.category,
          description: currentBookmark.description,
        }))

        toast.promise(saveBookmarkApi(bookmarks), {
          loading: `正在添加 ${bookmarks.length} 个书签...`,
          success: () => {
            setCurrentBookmark({ ...defaultBookMark })
            setEditMode(false)
            setSheetOpen(false)
            refreshBookmarks() // Refresh data
            return `成功添加 ${bookmarks.length} 个书签`
          },
          error: err => `${err.message}`,
        })
      }
    } catch (error) {
      console.error('保存书签失败:', error)
    }
  }

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    try {
      toast.promise(deleteBookmarkApi(id), {
        loading: '删除中...',
        success: () => {
          refreshBookmarks() // Refresh data
          return '书签删除成功'
        },
        error: err => `${err.message}`,
      })
    } catch (error) {
      console.error('删除书签失败:', error)
    }
  }

  // Edit bookmark
  const editBookmark = (bookmark: Bookmark) => {
    setCurrentBookmark(bookmark)
    setEditMode(true)
    setSheetOpen(true)
  }

  // Add new category
  const addCategory = () => {
    if (newCategory && !allCategories.includes(newCategory)) {
      setCurrentBookmark({ ...currentBookmark, category: newCategory })
      setNewCategory('')
      setShowCategoryInput(false)
    } else if (allCategories.includes(newCategory)) {
      toast.error('分类已存在')
    }
  }

  // Filter bookmarks
  const filteredBookmarks = bookmarks.filter(bookmark => {
    return (
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Group bookmarks by category
  const bookmarksByCategory = allCategories.reduce((acc, category) => {
    acc[category] = filteredBookmarks.filter(bookmark => bookmark.category === category)
    return acc
  }, {} as Record<string, Bookmark[]>)

  // Toggle category collapse
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> 添加
              </Button>
            </SheetTrigger>
            <SheetContent>
              <BookmarkForm
                currentBookmark={currentBookmark}
                setCurrentBookmark={setCurrentBookmark}
                categories={allCategories}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                showCategoryInput={showCategoryInput}
                setShowCategoryInput={setShowCategoryInput}
                addCategory={addCategory}
                saveBookmark={saveBookmark}
                editMode={editMode}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Skeleton screen - mimics categories and cards layout */}
          {[1, 2].map(category => (
            <div key={category} className="w-full">
              <div className="flex items-center border-b pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-8 w-40" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex flex-col p-4 bg-card rounded-lg border shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <div className="mt-auto pt-2 border-t flex justify-end items-center">
                        <div className="flex gap-1">
                          <Skeleton className="h-7 w-7 rounded" />
                          <Skeleton className="h-7 w-7 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categoryOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-6">
              {categoryOrder.map(category => (
                <DraggableCategory
                  key={category}
                  id={category}
                  category={category}
                  bookmarks={bookmarksByCategory[category] || []}
                  isCollapsed={!!collapsedCategories[category]}
                  toggleCategory={toggleCategory}
                >
                  {bookmarksByCategory[category]?.map(bookmark => (
                    <BookmarkCard
                      key={bookmark._id}
                      bookmark={bookmark}
                      editBookmark={editBookmark}
                      deleteBookmark={deleteBookmark}
                      isCompact={false}
                    />
                  ))}
                </DraggableCategory>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isLoading && filteredBookmarks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">未找到数据</h3>
          <p className="text-muted-foreground">
            {searchTerm ? '没有匹配的搜索结果' : '开始添加您的第一条数据吧！'}
          </p>
        </div>
      )}
    </div>
  )
}

export default BookmarkPage

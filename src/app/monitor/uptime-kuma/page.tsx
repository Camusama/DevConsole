'use client'

import { useState, KeyboardEvent, useEffect, useMemo } from 'react'
import { Plus, Search, Save, X, FolderPlus, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSWR from 'swr'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import DraggableCategory from './_components/DraggableCategory'
import DraggableBookmark from './_components/DraggableBookmark'
// 书签类型定义
export type Bookmark = {
  _id?: string
  _tempId?: string // 临时ID，用于没有_id的书签
  title: string
  url: string
  category: string
  description: string
  order?: number
  createdAt?: Date
  updatedAt?: Date
}

// 书签表单组件
type BookmarkFormProps = {
  currentBookmark: Bookmark
  setCurrentBookmark: (bookmark: Bookmark) => void
  categories: string[]
  newCategory: string
  setNewCategory: (category: string) => void
  showCategoryInput: boolean
  setShowCategoryInput: (show: boolean) => void
  addCategory: () => Promise<void>
  saveBookmark: () => void
  editMode: boolean
  isMobile?: boolean
}

// 表单字段组件
type FormFieldProps = {
  label: string
  id: string
  children: React.ReactNode
}

const FormField = ({ label, id, children }: FormFieldProps) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <label htmlFor={id} className="text-right">
      {label}
    </label>
    <div className="col-span-3">{children}</div>
  </div>
)

const BookmarkForm = ({
  currentBookmark,
  setCurrentBookmark,
  categories,
  newCategory,
  setNewCategory,
  showCategoryInput,
  setShowCategoryInput,
  addCategory,
  saveBookmark,
  editMode,
  isMobile = false,
}: BookmarkFormProps) => {
  const idSuffix = isMobile ? '-mobile' : ''

  // 处理回车键提交
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveBookmark()
    }
  }

  // 处理新分类回车键提交
  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      toast.promise(Promise.resolve(addCategory()), {
        loading: '创建分类中...',
        success: null,
        error: null,
      })
    }
  }

  // 处理批量添加的URL提示
  const urlPlaceholder = editMode ? '输入URL' : '输入URL，每行一个，可批量添加多个书签'

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editMode ? '编辑书签' : '添加新书签'}</SheetTitle>
        <SheetDescription>{editMode ? '修改书签信息' : '填写新书签的详细信息'}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4 pr-10">
        <FormField label="标题" id={`title${idSuffix}`}>
          <Input
            id={`title${idSuffix}`}
            value={currentBookmark.title}
            onChange={e => setCurrentBookmark({ ...currentBookmark, title: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="输入书签标题"
          />
        </FormField>

        <FormField label="URL" id={`url${idSuffix}`}>
          {editMode ? (
            <Input
              id={`url${idSuffix}`}
              value={currentBookmark.url}
              onChange={e => setCurrentBookmark({ ...currentBookmark, url: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder={urlPlaceholder}
            />
          ) : (
            <Textarea
              id={`url${idSuffix}`}
              value={currentBookmark.url}
              onChange={e => setCurrentBookmark({ ...currentBookmark, url: e.target.value })}
              placeholder={urlPlaceholder}
              className="min-h-[100px] font-mono text-sm"
            />
          )}
          {!editMode && (
            <p className="text-xs text-muted-foreground mt-1">
              <Link2 className="inline-block h-3 w-3 mr-1" />
              每行输入一个URL，可批量添加多个书签
            </p>
          )}
        </FormField>

        <FormField label="分类" id={`category${idSuffix}`}>
          <div className="flex gap-2">
            {showCategoryInput ? (
              <div className="flex w-full gap-2">
                <Input
                  id={`newCategory${idSuffix}`}
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="新分类名称"
                  onKeyDown={handleCategoryKeyDown}
                />
                <Button
                  size="icon"
                  onClick={() => {
                    toast.promise(Promise.resolve(addCategory()), {
                      loading: '创建分类中...',
                      success: null,
                      error: null,
                    })
                  }}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setShowCategoryInput(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={currentBookmark.category}
                  onValueChange={value =>
                    setCurrentBookmark({ ...currentBookmark, category: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline" onClick={() => setShowCategoryInput(true)}>
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </FormField>

        <FormField label="描述" id={`description${idSuffix}`}>
          <Input
            id={`description${idSuffix}`}
            value={currentBookmark.description}
            onChange={e => setCurrentBookmark({ ...currentBookmark, description: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        </FormField>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">取消</Button>
        </SheetClose>
        <Button onClick={saveBookmark}>{editMode ? '更新' : '保存'}</Button>
      </SheetFooter>
    </>
  )
}

const defaultBookMark = {
  title: '',
  url: '',
  category: '默认',
  description: '',
}

// API fetcher 函数
const fetchBookmarksApi = async () => {
  const response = await fetch('/api/bookmarks')
  if (!response.ok) {
    throw new Error('获取书签失败')
  }
  const data = await response.json()
  return data.bookmarks || []
}

// 获取分类顺序的 API 函数
const fetchCategoryOrderApi = async () => {
  const response = await fetch('/api/category-order?collection=bookmarks')
  if (!response.ok) {
    throw new Error('获取分类顺序失败')
  }
  const data = await response.json()
  return data.categoryOrder || []
}

// 保存分类顺序的 API 函数
const saveCategoryOrderApi = async (order: string[]) => {
  const response = await fetch('/api/category-order', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order, collectionName: 'bookmarks' }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '保存分类顺序失败')
  }

  return await response.json()
}

// 添加或更新书签的 API 函数
const saveBookmarkApi = async (bookmark: Bookmark | Bookmark[]) => {
  // 如果是单个书签且有ID，则为更新操作
  const isUpdate = !Array.isArray(bookmark) && bookmark._id
  const method = isUpdate ? 'PUT' : 'POST'

  const response = await fetch('/api/bookmarks', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookmark),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '操作失败')
  }

  return await response.json()
}

// 删除书签的 API 函数
const deleteBookmarkApi = async (id: string) => {
  const response = await fetch(`/api/bookmarks?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除失败')
  }

  return await response.json()
}

// 获取书签顺序的 API 函数
const fetchBookmarkOrderApi = async (category: string) => {
  const response = await fetch(`/api/bookmark-order?category=${encodeURIComponent(category)}`)
  if (!response.ok) {
    throw new Error('获取书签顺序失败')
  }
  const data = await response.json()
  return data.bookmarkOrder || []
}

// 保存书签顺序的 API 函数
const saveBookmarkOrderApi = async (order: string[], category: string) => {
  const response = await fetch('/api/bookmark-order', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order, category }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '保存书签顺序失败')
  }

  return await response.json()
}
export default function Home() {
  // 使用 SWR 获取书签数据
  const {
    data: bookmarks = [],
    isLoading,
    mutate: refreshBookmarks,
  } = useSWR<Bookmark[]>('/api/bookmarks', fetchBookmarksApi, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10秒内不重复请求
  })

  // 使用 SWR 获取分类顺序
  const { data: savedCategoryOrder = [], mutate: refreshCategoryOrder } = useSWR<string[]>(
    '/api/category-order?collection=bookmarks',
    fetchCategoryOrderApi,
    {
      revalidateOnFocus: false,
    }
  )

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [bookmarkOrders, setBookmarkOrders] = useState<Record<string, string[]>>({})

  // 编辑状态
  const [editMode, setEditMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark>({ ...defaultBookMark })

  // 从书签数据中提取分类
  const allCategories = useMemo(
    () => Array.from(new Set(bookmarks.map(bookmark => bookmark.category))),
    [bookmarks]
  )

  // 计算有效的分类顺序
  const computedCategoryOrder = useMemo(() => {
    if (bookmarks.length === 0) return []

    if (savedCategoryOrder.length > 0) {
      // 过滤掉不再存在的分类
      const validSavedCategories = savedCategoryOrder.filter(cat => allCategories.includes(cat))

      // 添加任何不在保存顺序中的新分类
      const newCategories = allCategories.filter(cat => !savedCategoryOrder.includes(cat))

      return [...validSavedCategories, ...newCategories]
    } else {
      return [...allCategories]
    }
  }, [bookmarks, savedCategoryOrder, allCategories])

  // 只在计算出的顺序变化时更新状态
  useEffect(() => {
    if (
      computedCategoryOrder.length > 0 &&
      JSON.stringify(computedCategoryOrder) !== JSON.stringify(categoryOrder)
    ) {
      setCategoryOrder(computedCategoryOrder)
    }
  }, [computedCategoryOrder, categoryOrder])

  // 加载每个分类的书签顺序
  useEffect(() => {
    const loadBookmarkOrders = async () => {
      if (allCategories.length === 0) return

      const orders: Record<string, string[]> = {}

      for (const category of allCategories) {
        try {
          const order = await fetchBookmarkOrderApi(category)
          orders[category] = order
        } catch (error) {
          console.error(`Error loading bookmark order for ${category}:`, error)
          // 如果获取失败，使用空数组
          orders[category] = []
        }
      }

      setBookmarkOrders(orders)
    }

    loadBookmarkOrders()
  }, [allCategories])

  // DnD 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 减小激活距离，使拖动更灵敏
      activationConstraint: {
        distance: 3,
        // 添加延迟约束，防止意外触发
        delay: 50,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 处理分类拖拽结束
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categoryOrder.indexOf(active.id.toString())
      const newIndex = categoryOrder.indexOf(over.id.toString())

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove([...categoryOrder], oldIndex, newIndex)

        // 立即更新本地状态和SWR缓存
        setCategoryOrder(newOrder)
        refreshCategoryOrder(newOrder)

        // 使用toast.promise来显示保存进度
        toast.promise(saveCategoryOrderApi(newOrder), {
          loading: '保存分类顺序中...',
          success: () => {
            // 成功后再次更新SWR缓存以确保同步
            refreshCategoryOrder()
            return '分类顺序已更新'
          },
          error: error => `保存分类顺序失败: ${error.message}`,
        })
      }
    }
  }

  // 处理书签拖拽结束
  const handleBookmarkDragEnd = (event: DragEndEvent, category: string) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // 获取当前分类的书签顺序
      const currentOrder = [...(bookmarkOrders[category] || [])]

      const oldIndex = currentOrder.indexOf(active.id.toString())
      const newIndex = currentOrder.indexOf(over.id.toString())

      if (oldIndex !== -1 && newIndex !== -1) {
        // 使用arrayMove创建新的排序数组
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex)

        // 立即更新本地状态，确保UI立即反映变化
        setBookmarkOrders(prev => ({
          ...prev,
          [category]: newOrder,
        }))

        // 使用toast.promise来显示保存进度
        toast.promise(saveBookmarkOrderApi(newOrder, category), {
          loading: '保存书签顺序中...',
          success: '书签顺序已更新',
          error: error => `保存书签顺序失败: ${error.message}`,
        })
      }
    }
  }

  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setEditMode(false)
      setCurrentBookmark({ ...defaultBookMark })
    }
    setSheetOpen(open)
  }

  // 添加或更新书签
  const saveBookmark = async () => {
    try {
      if (!currentBookmark.title || !currentBookmark.url) {
        toast.error('标题和URL是必填项')
        return
      }

      // 如果是编辑模式或URL中没有换行符，则按单个书签处理
      if (editMode || !currentBookmark.url.includes('\n')) {
        toast.promise(saveBookmarkApi(currentBookmark), {
          loading: '保存中...',
          success: () => {
            setCurrentBookmark({ ...defaultBookMark })
            setEditMode(false)
            setSheetOpen(false)
            refreshBookmarks() // 刷新数据
            return currentBookmark._id ? '书签更新成功' : '书签添加成功'
          },
          error: err => `${err.message}`,
        })
      } else {
        // 批量添加模式
        const urls = currentBookmark.url.split('\n').filter(url => url.trim() !== '')

        if (urls.length === 0) {
          toast.error('请输入至少一个有效的URL')
          return
        }

        // 创建批量书签数组
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
            refreshBookmarks() // 刷新数据
            return `成功添加 ${bookmarks.length} 个书签`
          },
          error: err => `${err.message}`,
        })
      }
    } catch (error) {
      console.error('保存书签失败:', error)
    }
  }

  // 删除书签
  const deleteBookmark = async (id: string) => {
    try {
      toast.promise(deleteBookmarkApi(id), {
        loading: '删除中...',
        success: () => {
          refreshBookmarks() // 刷新数据
          return '书签删除成功'
        },
        error: err => `${err.message}`,
      })
    } catch (error) {
      console.error('删除书签失败:', error)
    }
  }

  // 编辑书签
  const editBookmark = (bookmark: Bookmark) => {
    setCurrentBookmark(bookmark)
    setEditMode(true)
    setSheetOpen(true)
  }

  // 添加新分类
  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('分类名称不能为空')
      return
    }

    if (!allCategories.includes(newCategory)) {
      try {
        // 创建一个临时书签来确保分类被创建
        const tempBookmark: Bookmark = {
          title: `${newCategory} 分类`,
          url: `https://example.com/${newCategory.toLowerCase().replace(/\s+/g, '-')}`,
          category: newCategory,
          description: `${newCategory} 分类的描述`,
        }

        // 保存临时书签以创建分类
        await saveBookmarkApi(tempBookmark)

        // 更新当前书签的分类
        setCurrentBookmark({ ...currentBookmark, category: newCategory })

        // 刷新书签列表以获取新分类
        refreshBookmarks()

        // 更新UI状态
        setNewCategory('')
        setShowCategoryInput(false)

        toast.success(`已创建新分类: ${newCategory}`)
      } catch (error) {
        console.error('创建分类失败:', error)
        toast.error('创建分类失败')
      }
    } else {
      // 如果分类已存在，只需更新当前书签的分类
      setCurrentBookmark({ ...currentBookmark, category: newCategory })
      setNewCategory('')
      setShowCategoryInput(false)
      toast.info('已选择现有分类')
    }
  }

  // 过滤书签
  const filteredBookmarks = bookmarks.filter(bookmark => {
    return (
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // 按分类分组书签
  const bookmarksByCategory = allCategories.reduce(
    (acc: Record<string, Bookmark[]>, category: string) => {
      acc[category] = filteredBookmarks.filter(bookmark => bookmark.category === category)
      return acc
    },
    {} as Record<string, Bookmark[]>
  )

  // 控制分类折叠状态
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // 切换分类折叠状态
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">书签管理</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索书签..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> 添加书签
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
          {/* 骨架屏幕 - 模拟分类和卡片布局 */}
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
          onDragEnd={handleCategoryDragEnd}
          autoScroll={{
            threshold: {
              x: 0.1,
              y: 0.1,
            },
          }}
        >
          <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 gap-6">
              {categoryOrder.map((category: string) => {
                // 获取当前分类的书签
                const categoryBookmarks = bookmarksByCategory[category] || []

                // 获取当前分类的书签顺序
                const bookmarkOrder = bookmarkOrders[category] || []

                // 确保每个书签都有一个有效的ID用于排序
                // 如果书签没有_id，使用其索引作为临时ID
                const bookmarksWithIds = categoryBookmarks.map((bookmark, index) => {
                  if (!bookmark._id) {
                    return { ...bookmark, _tempId: `temp-${index}` }
                  }
                  return bookmark
                })

                // 创建一个包含所有书签ID的数组，用于排序
                const bookmarkIds = bookmarksWithIds.map(bookmark => {
                  // 确保返回一个非空字符串作为ID
                  return (
                    bookmark._id ||
                    bookmark._tempId ||
                    `fallback-${Math.random().toString(36).substring(2, 9)}`
                  )
                })

                // 合并已有顺序和新书签
                const sortedBookmarkIds = [
                  // 首先包含已有顺序中的ID（如果它们仍然存在于当前书签中）
                  ...bookmarkOrder.filter(id => bookmarkIds.includes(id)),
                  // 然后添加任何不在已有顺序中的新书签ID
                  ...bookmarkIds.filter(id => !bookmarkOrder.includes(id)),
                ]

                return (
                  <DraggableCategory
                    key={category}
                    id={category}
                    category={category}
                    bookmarks={categoryBookmarks}
                    isCollapsed={!!collapsedCategories[category]}
                    toggleCategory={toggleCategory}
                  >
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={event => handleBookmarkDragEnd(event, category)}
                      autoScroll={{
                        threshold: {
                          x: 0.1,
                          y: 0.1,
                        },
                      }}
                    >
                      <SortableContext
                        items={sortedBookmarkIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {sortedBookmarkIds.map(bookmarkId => {
                          const bookmark = categoryBookmarks.find(b => b._id === bookmarkId)
                          if (!bookmark) return null

                          return (
                            <DraggableBookmark
                              key={bookmarkId}
                              id={bookmarkId}
                              bookmark={bookmark}
                              editBookmark={editBookmark}
                              deleteBookmark={deleteBookmark}
                              isCompact={false}
                            />
                          )
                        })}
                      </SortableContext>
                    </DndContext>
                  </DraggableCategory>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isLoading && filteredBookmarks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">未找到书签</h3>
          <p className="text-muted-foreground">
            {searchTerm ? '没有匹配的搜索结果' : '开始添加您的第一个书签吧！'}
          </p>
        </div>
      )}
    </div>
  )
}

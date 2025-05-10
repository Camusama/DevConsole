'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit, Save, X, FolderPlus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
// 书签类型定义
type Bookmark = {
  _id?: string
  title: string
  url: string
  category: string
  description: string
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
  addCategory: () => void
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
          />
        </FormField>

        <FormField label="URL" id={`url${idSuffix}`}>
          <Input
            id={`url${idSuffix}`}
            value={currentBookmark.url}
            onChange={e => setCurrentBookmark({ ...currentBookmark, url: e.target.value })}
          />
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
                />
                <Button size="icon" onClick={addCategory}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setShowCategoryInput(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={currentBookmark.category}
                  onChange={e =>
                    setCurrentBookmark({ ...currentBookmark, category: e.target.value })
                  }
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
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

// 书签卡片组件
type BookmarkCardProps = {
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
}

// 书签操作按钮组件
type BookmarkActionsProps = {
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
}

const BookmarkActions = ({
  bookmark,
  editBookmark,
  deleteBookmark,
  isCompact = false,
}: BookmarkActionsProps) => {
  const iconSize = isCompact ? 'h-4 w-4' : 'h-3 w-3'
  const buttonSize = isCompact ? '' : 'h-7 w-7'

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={buttonSize}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          editBookmark(bookmark)
        }}
      >
        <Edit className={iconSize} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={buttonSize}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          if (bookmark._id) deleteBookmark(bookmark._id)
        }}
      >
        <Trash2 className={iconSize} />
      </Button>
    </div>
  )
}

// 书签图标组件
type BookmarkIconProps = {
  title: string
  isCompact?: boolean
}

const BookmarkIcon = ({ title, isCompact = false }: BookmarkIconProps) => {
  const size = isCompact ? 'w-6 h-6' : 'w-8 h-8'
  const textSize = isCompact ? 'text-xs' : ''

  return (
    <div
      className={`${size} rounded bg-muted flex items-center justify-center text-muted-foreground ${textSize} font-medium`}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  )
}

const BookmarkCard = ({
  bookmark,
  editBookmark,
  deleteBookmark,
  isCompact = false,
}: BookmarkCardProps) => {
  if (isCompact) {
    return (
      <div
        key={bookmark._id}
        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-all duration-200 transform hover:scale-[1.02]"
      >
        <div className="flex items-center gap-3 flex-1">
          <BookmarkIcon title={bookmark.title} isCompact={true} />
          <div>
            <div className="font-medium">{bookmark.title}</div>
            {bookmark.description && (
              <p className="text-sm text-muted-foreground">{bookmark.description}</p>
            )}
          </div>
        </div>
        <BookmarkActions
          bookmark={bookmark}
          editBookmark={editBookmark}
          deleteBookmark={deleteBookmark}
          isCompact={true}
        />
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow transition-all duration-200 overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        <BookmarkIcon title={bookmark.title} />
        <div className="font-medium truncate">{bookmark.title}</div>
      </div>
      {bookmark.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{bookmark.description}</p>
      )}
      <div className="text-xs text-muted-foreground mt-auto pt-2 border-t flex justify-between items-center">
        <span className="px-2 py-1 rounded-full bg-muted">{bookmark.category}</span>
        <BookmarkActions
          bookmark={bookmark}
          editBookmark={editBookmark}
          deleteBookmark={deleteBookmark}
        />
      </div>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 h-[calc(100%-50px)]"
        onClick={e => e.stopPropagation()}
      ></a>
    </div>
  )
}
const defaultBookMark = {
  title: '',
  url: '',
  category: '默认',
  description: '',
}
export default function Home() {
  // 状态管理
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)

  // 编辑状态
  const [editMode, setEditMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark>({ ...defaultBookMark })
  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setEditMode(false)
      setCurrentBookmark({ ...defaultBookMark })
    }
    setSheetOpen(open)
  }
  // 获取所有书签
  const fetchBookmarks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bookmarks')
      const data = await response.json()

      if (data.bookmarks) {
        setBookmarks(data.bookmarks)

        // 提取所有分类
        const uniqueCategories = Array.from(
          new Set(data.bookmarks.map((bookmark: Bookmark) => bookmark.category))
        )
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      toast.error('获取书签失败')
      console.error('获取书签失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchBookmarks()
  }, [])

  // 添加或更新书签
  const saveBookmark = async () => {
    try {
      if (!currentBookmark.title || !currentBookmark.url) {
        toast.error('标题和URL是必填项')
        return
      }

      const method = currentBookmark._id ? 'PUT' : 'POST'
      const response = await fetch('/api/bookmarks', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentBookmark),
      })

      if (response.ok) {
        toast.success(currentBookmark._id ? '书签更新成功' : '书签添加成功')
        setCurrentBookmark({
          ...defaultBookMark,
        })
        setEditMode(false)
        fetchBookmarks()
      } else {
        const error = await response.json()
        toast.error(error.error || '操作失败')
      }
    } catch (error) {
      toast.error('保存书签失败')
      console.error('保存书签失败:', error)
    }
  }

  // 删除书签
  const deleteBookmark = async (id: string) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('书签删除成功')
        fetchBookmarks()
      } else {
        const error = await response.json()
        toast.error(error.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除书签失败')
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
  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
      setCurrentBookmark({ ...currentBookmark, category: newCategory })
      setNewCategory('')
      setShowCategoryInput(false)
    } else if (categories.includes(newCategory)) {
      toast.error('分类已存在')
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
  const bookmarksByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredBookmarks.filter(bookmark => bookmark.category === category)
    return acc
  }, {} as Record<string, Bookmark[]>)

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索书签..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> 添加书签
              </Button>
            </SheetTrigger>
            <SheetContent>
              <BookmarkForm
                currentBookmark={currentBookmark}
                setCurrentBookmark={setCurrentBookmark}
                categories={categories}
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {categories.map(category => (
            <Collapsible
              key={category}
              defaultOpen={true}
              open={!collapsedCategories[category]}
              onOpenChange={() => toggleCategory(category)}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between border-b pb-2 mb-4 cursor-pointer">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                  >
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        !collapsedCategories[category]
                          ? 'transform rotate-0'
                          : 'transform rotate-180'
                      }`}
                    />
                    <h2 className="text-xl font-semibold">
                      {category}{' '}
                      <span className="text-sm text-muted-foreground">
                        ({bookmarksByCategory[category]?.length || 0})
                      </span>
                    </h2>
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {bookmarksByCategory[category]?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {bookmarksByCategory[category].map(bookmark => (
                      <BookmarkCard
                        key={bookmark._id}
                        bookmark={bookmark}
                        editBookmark={editBookmark}
                        deleteBookmark={deleteBookmark}
                        isCompact={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">该分类下暂无书签</div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {!loading && filteredBookmarks.length === 0 && (
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

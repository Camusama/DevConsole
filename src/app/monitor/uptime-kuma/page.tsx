'use client'

import { useState, KeyboardEvent } from 'react'
import { Plus, Search, Trash2, Edit, Save, X, FolderPlus, ChevronDown, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
      addCategory()
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
                <Button size="icon" onClick={addCategory}>
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    if (bookmark._id) {
      deleteBookmark(bookmark._id)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
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
            setShowDeleteDialog(true)
          }}
        >
          <Trash2 className={iconSize} />
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除书签 "{bookmark.title}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BookmarkIcon title={bookmark.title} isCompact={true} />
          <div className="min-w-0">
            <div className="font-medium truncate">{bookmark.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {bookmark.url.replace(/^https?:\/\//, '')}
            </div>
            {bookmark.description && (
              <p className="text-sm text-muted-foreground truncate">{bookmark.description}</p>
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
    <div className="group relative flex flex-col p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:scale-[1.02] hover:border-primary/20">
      <div className="flex items-center gap-3 mb-2">
        <BookmarkIcon title={bookmark.title} />
        <div className="font-medium truncate">{bookmark.title}</div>
      </div>
      {bookmark.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{bookmark.description}</p>
      )}
      <div className="text-xs text-muted-foreground mt-auto pt-2 border-t flex justify-end items-center">
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

// API fetcher 函数
const fetchBookmarksApi = async () => {
  const response = await fetch('/api/bookmarks')
  if (!response.ok) {
    throw new Error('获取书签失败')
  }
  const data = await response.json()
  return data.bookmarks || []
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

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)

  // 编辑状态
  const [editMode, setEditMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark>({ ...defaultBookMark })

  // 从书签数据中提取分类
  const categories = Array.from(new Set(bookmarks.map(bookmark => bookmark.category)))

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
  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      // 不需要手动更新categories，因为它是从bookmarks中派生的
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
                <div className="flex items-center justify-between border-b pb-3 mb-5 cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted rounded-md p-1 group-hover:bg-muted/80 transition-colors">
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${
                          !collapsedCategories[category]
                            ? 'transform rotate-0'
                            : 'transform rotate-180'
                        }`}
                      />
                    </div>
                    <h2 className="text-xl font-semibold">
                      {category}{' '}
                      <span className="text-sm text-muted-foreground">
                        ({bookmarksByCategory[category]?.length || 0})
                      </span>
                    </h2>
                  </div>
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

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR, { mutate } from 'swr'

import DraggableCategory from './DraggableCategory'
import CollectionForm from './CollectionForm'
import CollectionCard from './CollectionCard'
import { CollectionItem, CollectionConfig } from './types'
import {
  fetchCollectionItems,
  fetchCategoryOrder,
  saveCategoryOrder,
  saveCollectionItem,
  deleteCollectionItem,
} from './api-utils'
import {
  getLatestBackup,
  createBackup,
  restoreLatestBackupToMongoDB,
  restoreBackupToMongoDB,
} from '@/lib/pgBackup'
import BackupDialog from './BackupDialog'

// Default item template
const getDefaultItem = (defaultCategory: string): CollectionItem => ({
  title: '',
  url: '',
  category: defaultCategory,
  description: '',
})

// Collection page component
export default function CollectionPage({ config }: { config: CollectionConfig }) {
  // Use SWR to fetch collection data
  const {
    data: items = [],
    isLoading,
    mutate: refreshItems,
  } = useSWR<CollectionItem[]>(
    `collection-items-${config.collectionName}`,
    () => fetchCollectionItems(config.collectionName),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Don't repeat requests within 10 seconds
    }
  )

  // Use SWR to fetch category order
  const { data: savedCategoryOrder = [], mutate: refreshCategoryOrder } = useSWR<string[]>(
    `category-order-${config.collectionName}`,
    () => fetchCategoryOrder(config.collectionName),
    {
      revalidateOnFocus: false,
    }
  )

  // Use SWR to fetch latest backup info
  const {
    data: latestBackup,
    isLoading: isLoadingBackup,
    mutate: refreshBackupInfo,
  } = useSWR(
    `latest-backup-${config.collectionName}`,
    () => getLatestBackup(config.collectionName),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
      onError: error => {
        console.error('Failed to fetch backup info:', error)
      },
    }
  )

  // Compute last backup date from SWR data
  const lastBackupDate = useMemo(() => {
    if (latestBackup?.createdAt) {
      const date = new Date(latestBackup.createdAt)
      return date.toLocaleString('zh-CN')
    }
    return null
  }, [latestBackup])

  // State management
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])

  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<CollectionItem>(
    getDefaultItem(config.defaultCategory)
  )

  // 创建备份
  const handleBackup = async () => {
    if (items.length === 0) {
      toast.error('没有数据可备份')
      return
    }

    setIsBackingUp(true)
    try {
      await createBackup(config.collectionName, items, categoryOrder)
      refreshBackupInfo() // Refresh backup info using SWR
      toast.success('数据备份成功')
    } catch (error) {
      console.error('备份失败:', error)
      toast.error(error instanceof Error ? error.message : '备份失败')
    } finally {
      setIsBackingUp(false)
    }
  }

  // 从特定备份恢复
  const handleRestoreFromBackup = async (backupId: number) => {
    setIsRestoring(true)
    try {
      const result = await restoreBackupToMongoDB(backupId)

      // 刷新数据
      refreshItems()
      refreshCategoryOrder()
      refreshBackupInfo()

      toast.success(
        `已成功从 ${new Date(result.backupDate).toLocaleString('zh-CN')} 的备份恢复了 ${
          result.itemCount
        } 个项目`
      )
    } catch (error) {
      console.error('恢复失败:', error)
      toast.error(error instanceof Error ? error.message : '恢复失败')
    } finally {
      setIsRestoring(false)
    }
  }

  // 从最新备份恢复 (打开备份对话框)
  const handleRestore = () => {
    if (!lastBackupDate) {
      toast.error('没有可用的备份')
      return
    }

    setBackupDialogOpen(true)
  }

  // Extract categories from items data
  const allCategories = useMemo(
    () => Array.from(new Set(items.map(item => item.category))),
    [items]
  )

  // Compute valid category order
  const computedCategoryOrder = useMemo(() => {
    if (items.length === 0) return []

    if (savedCategoryOrder.length > 0) {
      // Filter out categories that no longer exist
      const validSavedCategories = savedCategoryOrder.filter(cat => allCategories.includes(cat))

      // Add any new categories not in the saved order
      const newCategories = allCategories.filter(cat => !savedCategoryOrder.includes(cat))

      return [...validSavedCategories, ...newCategories]
    } else {
      return [...allCategories]
    }
  }, [items, savedCategoryOrder, allCategories])

  // Update state when computed order changes
  useEffect(() => {
    if (
      computedCategoryOrder.length > 0 &&
      JSON.stringify(computedCategoryOrder) !== JSON.stringify(categoryOrder)
    ) {
      setCategoryOrder(computedCategoryOrder)
    }
  }, [computedCategoryOrder, categoryOrder])

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
      const oldIndex = categoryOrder.indexOf(active.id.toString())
      const newIndex = categoryOrder.indexOf(over.id.toString())

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove([...categoryOrder], oldIndex, newIndex)

        // Optimistic update
        setCategoryOrder(newOrder)
        refreshCategoryOrder(newOrder, false)

        // Save new order to server
        saveCategoryOrder(newOrder, config.collectionName)
          .then(() => {
            toast.success('分类顺序已更新')
          })
          .catch(error => {
            // Revert on error
            setCategoryOrder(categoryOrder)
            refreshCategoryOrder(categoryOrder, false)
            toast.error('保存分类顺序失败: ' + error.message)
          })
      }
    }
  }

  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setEditMode(false)
      setCurrentItem(getDefaultItem(config.defaultCategory))
    }
    setSheetOpen(open)
  }

  // Add or update item
  const saveItem = async () => {
    try {
      if (!currentItem.title || !currentItem.url) {
        toast.error('标题和URL是必填项')
        return
      }

      // Check if there's a new category to create
      const isNewCategory = showCategoryInput && newCategory && !allCategories.includes(newCategory)

      // If there's a new category, create it first
      if (isNewCategory) {
        try {
          // Create a temporary hidden item to keep the category
          const placeholderItem: CollectionItem = {
            title: `${newCategory} 分类`,
            url: `#${newCategory}`,
            category: newCategory,
            description: `${newCategory} 分类的占位项`,
          }

          // Save placeholder to database
          await saveCollectionItem(placeholderItem, config.collectionName)

          // Update current item's category
          setCurrentItem(prev => ({ ...prev, category: newCategory }))

          // Update category order
          const newOrder = [...categoryOrder, newCategory]
          setCategoryOrder(newOrder)

          // Save category order
          await saveCategoryOrder(newOrder, config.collectionName)

          // Refresh category data
          refreshCategoryOrder()

          setNewCategory('')
          setShowCategoryInput(false)
          toast.success(`已添加新分类: ${newCategory}`)
        } catch (error) {
          console.error('添加分类失败:', error)
          toast.error('添加分类失败: ' + (error as Error).message)
          return
        }
      }

      // If in edit mode or URL doesn't contain newlines, process as single item
      if (editMode || !currentItem.url.includes('\n')) {
        // If just created a new category, use the new category name
        const itemToSave = isNewCategory ? { ...currentItem, category: newCategory } : currentItem

        toast.promise(saveCollectionItem(itemToSave, config.collectionName), {
          loading: '保存中...',
          success: () => {
            setCurrentItem(getDefaultItem(config.defaultCategory))
            setEditMode(false)
            setSheetOpen(false)
            refreshItems() // Refresh data
            return itemToSave._id ? '更新成功' : '添加成功'
          },
          error: err => `${err.message}`,
        })
      } else {
        // Batch add mode
        const urls = currentItem.url.split('\n').filter(url => url.trim() !== '')

        if (urls.length === 0) {
          toast.error('请输入至少一个有效的URL')
          return
        }

        // If just created a new category, use the new category name
        const categoryToUse = isNewCategory ? newCategory : currentItem.category

        // Create batch items array
        const batchItems = urls.map(url => ({
          title: currentItem.title,
          url: url.trim(),
          category: categoryToUse,
          description: currentItem.description,
        }))

        toast.promise(saveCollectionItem(batchItems, config.collectionName), {
          loading: `正在添加 ${batchItems.length} 个项目...`,
          success: () => {
            setCurrentItem(getDefaultItem(config.defaultCategory))
            setEditMode(false)
            setSheetOpen(false)
            refreshItems() // Refresh data
            return `成功添加 ${batchItems.length} 个项目`
          },
          error: err => `${err.message}`,
        })
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // Delete item with optimistic updates
  const deleteItem = async (id: string) => {
    try {
      // Find the item to delete
      const itemToDelete = items.find(b => b._id === id)
      if (!itemToDelete) {
        toast.error('找不到要删除的项目')
        return
      }

      // Check if this is the only visible item in this category (excluding placeholder items)
      const categoryItems = items.filter(
        b => b.category === itemToDelete.category && !b.url.startsWith('#')
      )
      const isLastInCategory = categoryItems.length === 1

      // Optimistic update - remove item from local state
      const updatedItems = items.filter(item => item._id !== id)
      refreshItems(updatedItems, false)

      try {
        // Delete the item
        await deleteCollectionItem(id, config.collectionName)

        // Show success message
        toast.success('删除成功')

        // If this is the last visible item in the category, remove the category from the order
        if (isLastInCategory && itemToDelete.category !== config.defaultCategory) {
          const newOrder = categoryOrder.filter(c => c !== itemToDelete.category)

          // Find and delete the category's placeholder item
          const placeholderItem = items.find(
            b => b.category === itemToDelete.category && b.url.startsWith('#')
          )

          if (placeholderItem && placeholderItem._id) {
            try {
              await deleteCollectionItem(placeholderItem._id, config.collectionName)
            } catch (error) {
              console.error('删除占位项目失败:', error)
            }
          }

          // Save new category order
          try {
            await saveCategoryOrder(newOrder, config.collectionName)
            setCategoryOrder(newOrder)
            refreshCategoryOrder(newOrder, false)
            toast.success(`已删除空分类: ${itemToDelete.category}`)
          } catch (error) {
            console.error('删除分类失败:', error)
            toast.error('删除分类失败: ' + (error as Error).message)
          }
        }
      } catch (error) {
        // Revert optimistic update on error
        refreshItems()
        console.error('删除失败:', error)
        toast.error('删除失败: ' + (error as Error).message)
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败: ' + (error as Error).message)
    }
  }

  // Edit item
  const editItem = (item: CollectionItem) => {
    setCurrentItem(item)
    setEditMode(true)
    setSheetOpen(true)
  }

  // Add new category
  const addCategory = async () => {
    if (newCategory && !allCategories.includes(newCategory)) {
      try {
        // Create a temporary hidden item to keep the category
        const placeholderItem: CollectionItem = {
          title: `${newCategory} 分类`,
          url: `#${newCategory}`,
          category: newCategory,
          description: `${newCategory} 分类的占位项目`,
        }

        // Save placeholder to database
        await saveCollectionItem(placeholderItem, config.collectionName)

        // Update current item's category
        setCurrentItem({ ...currentItem, category: newCategory })

        // Update category order
        const newOrder = [...categoryOrder, newCategory]
        setCategoryOrder(newOrder)

        // Save category order
        await saveCategoryOrder(newOrder, config.collectionName)

        // Refresh data
        refreshItems()
        refreshCategoryOrder()

        setNewCategory('')
        setShowCategoryInput(false)
        toast.success(`已添加新分类: ${newCategory}`)
      } catch (error) {
        console.error('添加分类失败:', error)
        toast.error('添加分类失败: ' + (error as Error).message)
      }
    } else if (allCategories.includes(newCategory)) {
      toast.error('分类已存在')
    } else if (!newCategory) {
      toast.error('请输入分类名称')
    }
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return (
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [items, searchTerm])

  // Filter out placeholder items (URL starting with #)
  const visibleItems = useMemo(() => {
    return filteredItems.filter(item => !item.url.startsWith('#'))
  }, [filteredItems])

  // Group items by category
  const itemsByCategory = useMemo(() => {
    return allCategories.reduce((acc: Record<string, CollectionItem[]>, category: string) => {
      acc[category] = visibleItems.filter(item => item.category === category)
      return acc
    }, {} as Record<string, CollectionItem[]>)
  }, [allCategories, visibleItems])

  // Control category collapse state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Toggle category collapse state
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">{config.pageTitle}</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={config.searchPlaceholder}
              className="pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> {config.addButtonText}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <CollectionForm
                currentItem={currentItem}
                setCurrentItem={setCurrentItem}
                categories={allCategories}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                showCategoryInput={showCategoryInput}
                setShowCategoryInput={setShowCategoryInput}
                addCategory={addCategory}
                saveItem={saveItem}
                editMode={editMode}
                config={config}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 备份信息和备份按钮 */}
      <div className="flex justify-between items-center mb-6 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-500">
          {isLoadingBackup ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>加载备份信息...</span>
            </div>
          ) : lastBackupDate ? (
            `上次备份时间: ${lastBackupDate}`
          ) : (
            '尚未创建备份'
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRestore}
            variant="outline"
            size="sm"
            disabled={isRestoring || isBackingUp || !lastBackupDate || isLoadingBackup}
            className="flex items-center gap-1"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                恢复中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                从备份恢复
              </>
            )}
          </Button>
          <Button
            onClick={handleBackup}
            variant="outline"
            size="sm"
            disabled={isBackingUp || isRestoring || items.length === 0 || isLoadingBackup}
            className="flex items-center gap-1"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                备份中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                备份到 PostgreSQL
              </>
            )}
          </Button>
        </div>
      </div>
      <BackupDialog
        open={backupDialogOpen}
        onOpenChange={setBackupDialogOpen}
        collectionName={config.collectionName}
        onRestore={handleRestoreFromBackup}
        onRefreshBackups={refreshBackupInfo}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Skeleton screen - mimics category and card layout */}
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
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 gap-6">
              {categoryOrder.map((category: string) => (
                <DraggableCategory
                  key={category}
                  id={category}
                  category={category}
                  items={itemsByCategory[category] || []}
                  isCollapsed={!!collapsedCategories[category]}
                  toggleCategory={toggleCategory}
                >
                  {itemsByCategory[category]?.map((item: CollectionItem) => (
                    <CollectionCard
                      key={item._id}
                      item={item}
                      editItem={editItem}
                      deleteItem={deleteItem}
                      isCompact={false}
                      config={config}
                    />
                  ))}
                </DraggableCategory>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">{config.emptyStateTitle}</h3>
          <p className="text-muted-foreground">
            {searchTerm ? '没有匹配的搜索结果' : config.emptyStateDescription}
          </p>
        </div>
      )}
    </div>
  )
}

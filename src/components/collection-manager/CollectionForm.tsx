'use client'

import { KeyboardEvent } from 'react'
import { Save, X, FolderPlus, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { CollectionFormProps, FormFieldProps } from './types'

// Form field component
const FormField = ({ label, id, children }: FormFieldProps) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <label htmlFor={id} className="text-right">
      {label}
    </label>
    <div className="col-span-3">{children}</div>
  </div>
)

// Collection form component
const CollectionForm = ({
  currentItem,
  setCurrentItem,
  categories,
  newCategory,
  setNewCategory,
  showCategoryInput,
  setShowCategoryInput,
  addCategory,
  saveItem,
  editMode,
  isMobile = false,
  config,
}: CollectionFormProps) => {
  const idSuffix = isMobile ? '-mobile' : ''

  // Handle enter key submission
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveItem()
    }
  }

  // Handle new category enter key submission
  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void addCategory() // Use void operator to handle Promise
    }
  }

  // Handle batch URL input hint
  const urlPlaceholder = editMode ? '输入URL' : '输入URL，每行一个，可批量添加多个'

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editMode ? config.editFormTitle : config.formTitle}</SheetTitle>
        <SheetDescription>
          {editMode ? config.editFormDescription : config.formDescription}
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4 pr-10">
        <FormField label="标题" id={`title${idSuffix}`}>
          <Input
            id={`title${idSuffix}`}
            value={currentItem.title}
            onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="输入标题"
          />
        </FormField>

        <FormField label="URL" id={`url${idSuffix}`}>
          {editMode ? (
            <Input
              id={`url${idSuffix}`}
              value={currentItem.url}
              onChange={e => setCurrentItem({ ...currentItem, url: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder={urlPlaceholder}
            />
          ) : (
            <Textarea
              id={`url${idSuffix}`}
              value={currentItem.url}
              onChange={e => setCurrentItem({ ...currentItem, url: e.target.value })}
              placeholder={urlPlaceholder}
              className="min-h-[100px] font-mono text-sm"
            />
          )}
          {!editMode && (
            <p className="text-xs text-muted-foreground mt-1">
              <Link2 className="inline-block h-3 w-3 mr-1" />
              每行输入一个URL，可批量添加多个
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
                <Button size="icon" onClick={() => void addCategory()}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setShowCategoryInput(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={currentItem.category}
                  onValueChange={value => setCurrentItem({ ...currentItem, category: value })}
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
            value={currentItem.description}
            onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        </FormField>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">取消</Button>
        </SheetClose>
        <Button onClick={saveItem}>{editMode ? '更新' : '保存'}</Button>
      </SheetFooter>
    </>
  )
}

export default CollectionForm

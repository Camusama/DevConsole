// Collection item type definition
export type CollectionItem = {
  _id?: string
  title: string
  url: string
  category: string
  description: string
  createdAt?: Date
  updatedAt?: Date
  [key: string]: any // Allow for additional properties
}

// Collection page configuration
export type CollectionConfig = {
  collectionName: string
  pageTitle: string
  addButtonText: string
  formTitle: string
  formDescription: string
  editFormTitle: string
  editFormDescription: string
  deleteConfirmTitle: string
  deleteConfirmDescription: string
  emptyStateTitle: string
  emptyStateDescription: string
  searchPlaceholder: string
  defaultCategory: string
}

// Collection form props
export type CollectionFormProps = {
  currentItem: CollectionItem
  setCurrentItem: (item: CollectionItem) => void
  categories: string[]
  newCategory: string
  setNewCategory: (category: string) => void
  showCategoryInput: boolean
  setShowCategoryInput: (show: boolean) => void
  addCategory: () => void
  saveItem: () => void
  editMode: boolean
  isMobile?: boolean
  config: CollectionConfig
}

// Form field props
export type FormFieldProps = {
  label: string
  id: string
  children: React.ReactNode
}

// Collection card props
export type CollectionCardProps = {
  item: CollectionItem
  editItem: (item: CollectionItem) => void
  deleteItem: (id: string) => void
  isCompact?: boolean
  config: CollectionConfig
}

// Collection actions props
export type CollectionActionsProps = {
  item: CollectionItem
  editItem: (item: CollectionItem) => void
  deleteItem: (id: string) => void
  isCompact?: boolean
  config: CollectionConfig
}

// Collection icon props
export type CollectionIconProps = {
  title: string
  isCompact?: boolean
}

// Draggable category props
export type DraggableCategoryProps = {
  id: string
  category: string
  items: CollectionItem[]
  isCollapsed: boolean
  toggleCategory: (category: string) => void
  children: React.ReactNode
}

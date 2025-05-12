import { CollectionItem } from './types'

// Fetch items from a collection
export const fetchCollectionItems = async (collectionName: string) => {
  const response = await fetch(`/api/bookmarks?collection=${collectionName}`)
  if (!response.ok) {
    throw new Error(`获取${collectionName}失败`)
  }
  const data = await response.json()
  return data.bookmarks || []
}

// Fetch category order for a collection
export const fetchCategoryOrder = async (collectionName: string) => {
  const response = await fetch(`/api/category-order?collection=${collectionName}`)
  if (!response.ok) {
    throw new Error(`获取${collectionName}分类顺序失败`)
  }
  const data = await response.json()
  return data.categoryOrder || []
}

// Save category order for a collection
export const saveCategoryOrder = async (order: string[], collectionName: string) => {
  const response = await fetch('/api/category-order', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order, collectionName }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `保存${collectionName}分类顺序失败`)
  }

  return await response.json()
}

// Add or update an item in a collection
export const saveCollectionItem = async (
  item: CollectionItem | CollectionItem[],
  collectionName: string
) => {
  // If it's a single item with ID, it's an update operation
  const isUpdate = !Array.isArray(item) && item._id
  const method = isUpdate ? 'PUT' : 'POST'

  // Add collection name to the request
  const requestData = Array.isArray(item)
    ? item.map(i => ({ ...i, collection: collectionName }))
    : { ...item, collection: collectionName }

  const response = await fetch('/api/bookmarks', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '操作失败')
  }

  return await response.json()
}

// Delete an item from a collection
export const deleteCollectionItem = async (id: string, collectionName: string) => {
  const response = await fetch(`/api/bookmarks?id=${id}&collection=${collectionName}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除失败')
  }

  return await response.json()
}

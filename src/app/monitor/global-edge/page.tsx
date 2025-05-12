'use client'

import { CollectionPage, CollectionConfig } from '@/components/collection-manager'

// Configuration for the GlobalEdge collection
const edgeConfig: CollectionConfig = {
  collectionName: 'GlobalEdge',
  pageTitle: 'Global Edge 服务',
  addButtonText: '添加书签',
  formTitle: '添加新书签',
  formDescription: '填写新书签的详细信息',
  editFormTitle: '编辑书签',
  editFormDescription: '修改书签信息',
  deleteConfirmTitle: '确认删除',
  deleteConfirmDescription: '您确定要删除书签 "{title}" 吗？此操作无法撤销。',
  emptyStateTitle: '未找到书签',
  emptyStateDescription: '开始添加您的第一个书签吧！',
  searchPlaceholder: '搜索书签...',
  defaultCategory: '默认',
}

export default function EdgePage() {
  return <CollectionPage config={edgeConfig} />
}

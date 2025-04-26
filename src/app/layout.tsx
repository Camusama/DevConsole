import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { MainLayout } from '@/components/layout/main-layout'
import './globals.css'
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '开发控制台',
  description: '个人开发控制台应用',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}

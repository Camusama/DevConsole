import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ConsoleLayout } from '@/components/page-layouts/ConsoleLayout'
import { AppProviders } from '@/providers'

import { ClerkProvider } from '@clerk/nextjs'

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
  title: 'DevConsole',
  description: 'Marquez’s DevConsole',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <AppProviders>
            <ConsoleLayout>{children}</ConsoleLayout>
          </AppProviders>
        </body>
      </html>
    </ClerkProvider>
  )
}

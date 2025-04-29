import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ConsoleLayout } from '@/components/page-layouts/ConsoleLayout'
import { Toaster } from '@/components/ui/sonner'

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

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
          <ConsoleLayout>{children}</ConsoleLayout>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/queryProvider'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Toaster } from '@/components/ui/Toaster'
import AuthSessionProvider from '@/components/providers/SessionProvider'
import '@/lib/clearLegacyData' // Clear legacy data on app load

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Layline',
  description: 'Set sail for your next job',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          defer
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY'}&libraries=places`}
        ></script>
      </head>
      <body className={inter.className}>
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
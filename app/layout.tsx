import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Policy Tracker',
  description: 'Track and monitor AI policy developments worldwide',
  icons: {
    icon: {
      url: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232563eb'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/%3e%3ccircle cx='10' cy='8' r='1' fill='%232563eb'/%3e%3ccircle cx='14' cy='8' r='1' fill='%232563eb'/%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M10 8h4'/%3e%3c/svg%3e",
      type: "image/svg+xml",
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <div className="flex items-center mr-3">
                    <svg 
                      className="h-8 w-8 text-blue-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      {/* Clean document with AI circuit accent */}
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                      {/* Simple AI nodes */}
                      <circle cx="10" cy="8" r="1" fill="currentColor" />
                      <circle cx="14" cy="8" r="1" fill="currentColor" />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1} 
                        d="M10 8h4" 
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Policy Tracker
                  </h1>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

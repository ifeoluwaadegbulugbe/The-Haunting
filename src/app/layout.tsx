import type { Metadata } from 'next'
import { Cinzel, Cormorant_Garamond, Inter, Caveat } from 'next/font/google'
import { HydrationGuard } from '@/components/ui/HydrationGuard'
import '@/styles/globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'THE HAUNTING',
  description: 'Investigate · Uncover · Be Found',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={[
        cinzel.variable,
        cormorant.variable,
        inter.variable,
        caveat.variable,
      ].join(' ')}
    >
      <body><HydrationGuard>{children}</HydrationGuard></body>
    </html>
  )
}

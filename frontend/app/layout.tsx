import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrainBot: AI Customer Support Training',
  description: 'AI-powered customer simulation for support agent onboarding',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

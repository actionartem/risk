import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const display = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-display" })

export const metadata: Metadata = {
  title: "Планирование загрузки команды разработки",
  description: "Расчёт необходимого количества разработчиков с учётом объёма работ, рисков и текучки кадров",
  generator: "artivtw",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`font-sans antialiased ${_geist.className} ${display.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

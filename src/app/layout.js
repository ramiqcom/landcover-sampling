import './globals.css'

export const metadata = {
  title: 'Land cover sampling',
  description: 'Sample land cover online',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import { Come } from '@/components/Come'

export const metadata = {
  title: 'Somebody asked you — DUB',
  /*
    Not indexed. An invitation is addressed to one person and a search engine following it
    would spend the code on a crawler.
  */
  robots: { index: false, follow: false },
}

export default async function ComePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <Come code={code} />
}

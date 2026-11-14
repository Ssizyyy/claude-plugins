import type { CSSProperties, ImgHTMLAttributes } from 'react'

type Src = string | { src: string }
interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: Src
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
  quality?: number
  placeholder?: string
  blurDataURL?: string
}

// Stand-in for next/image: a plain <img>. `fill` becomes an absolutely positioned cover image.
export default function Image({ src, fill, priority, unoptimized, quality, placeholder, blurDataURL, style, ...rest }: Props) {
  void priority, unoptimized, quality, placeholder, blurDataURL
  const fillStyle: CSSProperties | undefined = fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : undefined
  return <img src={typeof src === 'string' ? src : src.src} style={{ ...fillStyle, ...style }} {...rest} />
}

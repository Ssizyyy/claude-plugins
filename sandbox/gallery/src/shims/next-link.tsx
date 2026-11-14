import type { AnchorHTMLAttributes } from 'react'

// Stand-in for next/link: a plain anchor that never navigates the gallery away.
export default function Link({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | { pathname?: string } }) {
  return <a href="#" data-href={typeof href === 'string' ? href : (href as { pathname?: string }).pathname} onClick={(e) => e.preventDefault()} {...rest} />
}

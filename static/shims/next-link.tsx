/* <Link> для статической сборки: обычный <a> с hash-навигацией. */

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigateStatic } from "./next-navigation";

type StaticLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
};

export default function Link({
  href,
  children,
  prefetch,
  replace = false,
  scroll,
  shallow,
  onClick,
  ...rest
}: StaticLinkProps) {
  void prefetch;
  void shallow;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigateStatic(href, replace, scroll);
  };

  return (
    <a href={`#${href}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

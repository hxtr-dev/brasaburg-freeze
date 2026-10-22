import Link from 'next/link';
import Background from '@/components/Background';
import CookieConsent, { CookieSettingsLink } from '@/components/CookieConsent';
import { CartProvider } from '@/components/CartProvider';
import SiteHeader from '@/components/SiteHeader';

export default function SiteLayout({ children }) {
  return (
    <CartProvider>
      <Background />
      <SiteHeader />
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>© 2026 BrasaBurg &amp; Freeze · Do fogo ao gelo</span>
        <nav className="footer-links" aria-label="Rodapé">
          <Link href="/privacidade">Política de Privacidade</Link>
          <CookieSettingsLink />
          <a href="https://instagram.com/brasafreeze" target="_blank" rel="noreferrer">@brasafreeze</a>
        </nav>
      </footer>
      <CookieConsent />
    </CartProvider>
  );
}

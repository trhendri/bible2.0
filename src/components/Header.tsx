import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Bookmark, LogOut } from 'lucide-react';
import { useSession } from '@/context/SessionProvider';
import { cn } from '@/lib/utils';

const Header = () => {
  const { supabase } = useSession();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const linkClasses = "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";
  const activeLinkClasses = "bg-primary text-primary-foreground";
  const inactiveLinkClasses = "text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span className="font-bold">Bible App</span>
          </Link>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <NavLink
              to="/"
              className={({ isActive }) => cn(linkClasses, isActive ? activeLinkClasses : inactiveLinkClasses)}
            >
              <BookOpen className="h-4 w-4" />
              Reader
            </NavLink>
            <NavLink
              to="/bookmarks"
              className={({ isActive }) => cn(linkClasses, isActive ? activeLinkClasses : inactiveLinkClasses)}
            >
              <Bookmark className="h-4 w-4" />
              My Bookmarks
            </NavLink>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
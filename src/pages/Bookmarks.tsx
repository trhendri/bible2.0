import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/context/SessionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bookmark, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface BookmarkRecord {
  id: string;
  verse_id: string;
}

interface BookmarkedVerse {
  bookmarkId: string;
  verseId: string;
  reference: string;
  text: string;
}

const BookmarksPage = () => {
  const { session, supabase } = useSession();
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkedVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarkedVerses = useCallback(async () => {
    if (!session?.user) return;
    setIsLoading(true);

    try {
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('id, verse_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const versePromises = bookmarks.map(async (bm: BookmarkRecord) => {
        try {
          const [book, chapter, verseNum] = bm.verse_id.split('.');
          const bookName = book.replace(/\s/g, '+');
          const apiReference = `${bookName}+${chapter}:${verseNum}`;
          
          const response = await fetch(`https://bible-api.com/${apiReference}`);
          
          if (!response.ok) {
            console.error(`Failed to fetch verse ${bm.verse_id}`);
            return null;
          }
          const data = await response.json();
          return {
            bookmarkId: bm.id,
            verseId: bm.verse_id,
            reference: data.reference,
            text: data.text,
          };
        } catch (e) {
          console.error(`Error processing bookmark ${bm.verse_id}`, e);
          return null;
        }
      });

      const verses = (await Promise.all(versePromises)).filter(Boolean) as BookmarkedVerse[];
      setBookmarkedVerses(verses);

    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      showError('Failed to load your bookmarks.');
    } finally {
      setIsLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    fetchBookmarkedVerses();
  }, [fetchBookmarkedVerses]);

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      setBookmarkedVerses(prev => prev.filter(v => v.bookmarkId !== bookmarkId));
      showSuccess('Bookmark removed');
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      showError('Failed to remove bookmark.');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-6 w-6" />
          My Bookmarks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookmarkedVerses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">You haven't bookmarked any verses yet.</p>
        ) : (
          <div className="space-y-4">
            {bookmarkedVerses.map((verse) => (
              <div key={verse.bookmarkId} className="p-4 border rounded-lg flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-2">{verse.reference}</h3>
                  <p className="text-base leading-relaxed">{verse.text}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteBookmark(verse.bookmarkId)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  aria-label="Delete bookmark"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookmarksPage;
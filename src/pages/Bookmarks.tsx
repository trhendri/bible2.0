import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/context/SessionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bookmark } from 'lucide-react';
import { showError } from '@/utils/toast';
import VerseText from '@/components/VerseText';
import BookmarkButton from '@/components/BookmarkButton';

interface BookmarkRecord {
  id: string;
  verse_id: string;
}

interface BookmarkedVerse {
  id: string;
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
          const [book, chapter, verse] = bm.verse_id.split('.');
          const bookName = book.replace(/\s/g, '+');
          const response = await fetch(`https://bible-api.com/${bookName}+${chapter}:${verse}`);
          if (!response.ok) {
            console.error(`Failed to fetch verse ${bm.verse_id}`);
            return null;
          }
          const data = await response.json();
          return {
            id: bm.verse_id,
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
              <div key={verse.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{verse.reference}</h3>
                <VerseText>
                  <span>{verse.text}</span>
                  <BookmarkButton verseId={verse.id} />
                </VerseText>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookmarksPage;
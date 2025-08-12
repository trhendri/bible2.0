import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/context/SessionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bookmark } from 'lucide-react';
import { showError } from '@/utils/toast';
import VerseText from '@/components/VerseText';
import BookmarkButton from '@/components/BookmarkButton';
import { BookData, Verse } from '@/types/bible';

interface BookmarkRecord {
  id: string;
  verse_id: string;
}

interface BookmarkedVerse extends Verse {
  bookName: string;
  chapter: number;
  verseId: string;
}

const BookmarksPage = () => {
  const { session, supabase } = useSession();
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkedVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<BookData[]>([]);

  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch(`https://bible.helloao.org/api/v1/books`);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      setBooks(data.data);
    } catch (err) {
      console.error(err);
      showError('Could not load book list.');
    }
  }, []);

  const fetchBookmarkedVerses = useCallback(async () => {
    if (!session?.user || books.length === 0) return;
    setIsLoading(true);

    try {
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('id, verse_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupedByChapter = bookmarks.reduce((acc: Record<string, BookmarkRecord[]>, bm: BookmarkRecord) => {
        const parts = bm.verse_id.split('.');
        if (parts.length < 2) return acc;
        const [bookId, chapter] = parts;
        const key = `${bookId}.${chapter}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(bm);
        return acc;
      }, {});

      const versePromises = Object.entries(groupedByChapter).map(async ([key, bms]) => {
        const [bookId, chapter] = key.split('.');
        const response = await fetch(`https://bible.helloao.org/api/v1/books/${bookId}/chapters/${chapter}`);
        if (!response.ok) {
            console.error(`Failed to fetch chapter ${key}`);
            return [];
        }
        const chapterData = await response.json();
        const bookName = books.find(b => b.id === Number(bookId))?.name || `Book ${bookId}`;

        return bms.map(bm => {
            const verseNumber = parseInt(bm.verse_id.split('.')[2]);
            const verseData = chapterData.data.verses.find((v: Verse) => v.verse === verseNumber);
            return {
                text: verseData?.text || 'Verse text not found.',
                verse: verseNumber,
                bookName,
                chapter: parseInt(chapter),
                verseId: bm.verse_id,
            };
        });
      });

      const versesByChapter = await Promise.all(versePromises);
      const sortedVerses = versesByChapter.flat().sort((a, b) => {
        const aParts = a.verseId.split('.').map(Number);
        const bParts = b.verseId.split('.').map(Number);
        if (aParts[0] !== bParts[0]) return aParts[0] - bParts[0]; // Book
        if (aParts[1] !== bParts[1]) return aParts[1] - bParts[1]; // Chapter
        return aParts[2] - bParts[2]; // Verse
      });
      setBookmarkedVerses(sortedVerses);

    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      showError('Failed to load your bookmarks.');
    } finally {
      setIsLoading(false);
    }
  }, [session, supabase, books]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    if (books.length > 0 && session?.user) {
        fetchBookmarkedVerses();
    }
  }, [books, session, fetchBookmarkedVerses]);

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
              <div key={verse.verseId} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{verse.bookName} {verse.chapter}:{verse.verse}</h3>
                <VerseText>
                  <span>{verse.text}</span>
                  <BookmarkButton verseId={verse.verseId} />
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
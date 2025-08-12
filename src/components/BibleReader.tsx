import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import VerseText from './VerseText';
import BookmarkButton from './BookmarkButton';
import BookDropdown from './BookDropdown';
import ChapterSelector from './ChapterSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BibleReaderProps {
  translation?: string;
}

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface HighlightToolbarProps {
  verseId: string;
  onHighlight: (color: string) => void;
}

const HighlightToolbar = ({ verseId, onHighlight }: HighlightToolbarProps) => {
  const colors = [
    { name: 'Yellow', value: 'bg-yellow-200' },
    { name: 'Green', value: 'bg-green-200' },
    { name: 'Blue', value: 'bg-blue-200' },
    { name: 'Pink', value: 'bg-pink-200' },
    { name: 'Remove', value: 'bg-transparent' }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2">
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <Button
              key={color.value}
              variant="ghost"
              className={`h-8 w-8 p-0 ${color.value}`}
              onClick={() => onHighlight(color.value)}
              aria-label={color.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const BibleReader: React.FC<BibleReaderProps> = ({ translation = "KJV" }) => {
  const { session, supabase } = useSession();
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVerses = async () => {
    setLoading(true);
    try {
      const bookName = book.replace(/\s/g, '+');
      const response = await fetch(
        `https://bible-api.com/${bookName}+${chapter}?translation=${translation}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch verses');
      }
      const data = await response.json();
      setVerses(data.verses);
    } catch (error) {
      console.error(error);
      showError('Could not load verses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const highlightVerse = async (verseId: string, color: string) => {
    if (!session?.user) {
      showError('You must be logged in to highlight verses');
      return;
    }

    try {
      const { error } = await supabase
        .from('highlights')
        .upsert({
          user_id: session.user.id,
          verse_id: verseId,
          color: color === 'bg-transparent' ? null : color
        });

      if (error) throw error;
      showSuccess(color === 'bg-transparent' ? 'Highlight removed' : 'Verse highlighted');
    } catch (err) {
      showError('Failed to update highlight');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVerses();
  }, [book, chapter, translation]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BookDropdown value={book} onChange={setBook} />
            <ChapterSelector book={book} value={chapter} onChange={setChapter} />
          </div>
          <Button onClick={fetchVerses} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          verses.map((verse) => (
            <div key={verse.verse} className="p-3 mb-2">
              <VerseText>
                <sup className="font-bold text-gray-500 dark:text-gray-400 mr-2 min-w-[1.5rem] text-sm">
                  {verse.verse}
                </sup>
                <span className="text-base leading-relaxed">{verse.text}</span>
                <BookmarkButton verseId={`${verse.book_name}.${verse.chapter}.${verse.verse}`} />
                <HighlightToolbar 
                  verseId={`${verse.book_name}.${verse.chapter}.${verse.verse}`}
                  onHighlight={(color) => highlightVerse(
                    `${verse.book_name}.${verse.chapter}.${verse.verse}`,
                    color
                  )}
                />
              </VerseText>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default BibleReader;
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
  currentColor: string | null;
  onHighlight: (color: string | null) => void;
}

interface Highlight {
  verse_id: string;
  color: string | null;
}

const HighlightToolbar = ({ verseId, currentColor, onHighlight }: HighlightToolbarProps) => {
  const colors = [
    { name: 'Yellow', value: 'bg-yellow-200' },
    { name: 'Green', value: 'bg-green-200' },
    { name: 'Blue', value: 'bg-blue-200' },
    { name: 'Pink', value: 'bg-pink-200' },
    { name: 'Remove', value: null }
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
              key={color.value || 'remove'}
              variant="ghost"
              className={`h-8 w-8 p-0 ${color.value || 'bg-transparent'} ${currentColor === color.value ? 'ring-2 ring-primary' : ''}`}
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
  const [highlights, setHighlights] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [highlightsLoading, setHighlightsLoading] = useState(false);

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
      fetchHighlights(data.verses);
    } catch (error) {
      console.error(error);
      showError('Could not load verses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlights = async (verses: Verse[]) => {
    if (!session?.user) return;

    setHighlightsLoading(true);
    try {
      const verseIds = verses.map(v => `${v.book_name}.${v.chapter}.${v.verse}`);
      
      const { data, error } = await supabase
        .from('highlights')
        .select('verse_id, color')
        .in('verse_id', verseIds)
        .eq('user_id', session.user.id);

      if (error) throw error;

      const highlightsMap = data.reduce((acc, curr) => {
        acc[curr.verse_id] = curr.color;
        return acc;
      }, {} as Record<string, string | null>);

      setHighlights(highlightsMap);
    } catch (err) {
      console.error('Failed to fetch highlights:', err);
    } finally {
      setHighlightsLoading(false);
    }
  };

  const highlightVerse = async (verseId: string, color: string | null) => {
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
          color
        }, {
          onConflict: 'user_id,verse_id'
        });

      if (error) throw error;

      setHighlights(prev => ({
        ...prev,
        [verseId]: color
      }));

      showSuccess(color ? 'Verse highlighted' : 'Highlight removed');
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
          verses.map((verse) => {
            const verseId = `${verse.book_name}.${verse.chapter}.${verse.verse}`;
            const highlightColor = highlights[verseId];
            
            return (
              <div 
                key={verse.verse} 
                className={`p-3 mb-2 rounded ${highlightColor || ''} ${highlightColor ? 'transition-colors duration-200' : ''}`}
              >
                <VerseText>
                  <sup className="font-bold text-gray-500 dark:text-gray-400 mr-2 min-w-[1.5rem] text-sm">
                    {verse.verse}
                  </sup>
                  <span className="text-base leading-relaxed">{verse.text}</span>
                  <BookmarkButton verseId={verseId} />
                  <HighlightToolbar 
                    verseId={verseId}
                    currentColor={highlightColor || null}
                    onHighlight={(color) => highlightVerse(verseId, color)}
                  />
                </VerseText>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default BibleReader;
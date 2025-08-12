import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { showError } from '@/utils/toast';
import VerseText from './VerseText';
import BookmarkButton from './BookmarkButton';

interface Verse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

const DailyVerse = () => {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyVerse = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://bible-api.com/random?translation=kjv');
      if (!response.ok) {
        throw new Error('Failed to fetch daily verse');
      }
      const data = await response.json();
      setVerse(data);
    } catch (error) {
      console.error(error);
      showError('Could not load a random verse. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyVerse();
  }, [fetchDailyVerse]);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Verse of the Day</span>
          <Button variant="ghost" size="icon" onClick={fetchDailyVerse} disabled={loading}>
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : verse ? (
          <div>
            <h3 className="text-xl font-semibold text-center mb-4">{verse.reference}</h3>
            <VerseText>
              <span className="text-lg leading-relaxed">{verse.text}</span>
              <BookmarkButton verseId={`${verse.book_name}.${verse.chapter}.${verse.verse}`} />
            </VerseText>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Could not load verse.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyVerse;
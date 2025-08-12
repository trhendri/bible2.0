import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen } from "lucide-react";
import { showError } from "@/utils/toast";
import VerseText from './VerseText';
import BookmarkButton from './BookmarkButton';
import BookDropdown from './BookDropdown';
import ChapterSelector from './ChapterSelector';

interface ApiVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleReaderProps {
  translation?: string;
}

const BibleReader: React.FC<BibleReaderProps> = ({ translation = "KJV" }) => {
  const [currentBook, setCurrentBook] = useState("Genesis");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState<ApiVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChapter = useCallback(async (book: string, chapter: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const bookName = book.replace(/\s/g, '+');
      const response = await fetch(
        `https://bible-api.com/${bookName}+${chapter}?translation=${translation.toLowerCase()}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setVerses(data.verses);
    } catch (err) {
      const message = (err as Error).message;
      console.error(`Failed to load chapter ${chapter} of ${book}:`, message);
      showError(`Failed to load chapter: ${message}`);
      setError(message);
      setVerses([]);
    } finally {
      setIsLoading(false);
    }
  }, [translation]);

  useEffect(() => {
    loadChapter(currentBook, currentChapter);
  }, [currentBook, currentChapter, loadChapter]);

  const handleBookChange = (book: string) => {
    setCurrentBook(book);
    setCurrentChapter(1);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="text-center relative">
        <div className="flex items-center justify-center mb-2">
          <BookOpen className="h-8 w-8 text-primary mr-2" />
          <CardTitle className="text-2xl font-bold">Bible Reader</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Version: {translation}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-center">
          <BookDropdown value={currentBook} onChange={handleBookChange} />
        </div>

        <div className="flex justify-center items-center mb-6">
          <ChapterSelector book={currentBook} value={currentChapter} onChange={setCurrentChapter} />
        </div>

        <ScrollArea className="h-[50vh] w-full rounded-md border p-4 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading verses...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4 rounded-md bg-red-50 dark:bg-red-900/20">
              <p className="font-medium">Error loading chapter</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          ) : verses.length > 0 ? (
            <div className="text-left">
              {verses.map((verse) => (
                <div key={verse.verse} className="p-3 mb-2">
                  <VerseText>
                    <sup className="font-bold text-gray-500 dark:text-gray-400 mr-2 min-w-[1.5rem] text-sm">{verse.verse}</sup>
                    <span className="text-base leading-relaxed">{verse.text}</span>
                    <BookmarkButton verseId={`${verse.book_name}.${verse.chapter}.${verse.verse}`} />
                  </VerseText>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4">
              No verses found for this chapter. It may not be available in this translation.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BibleReader;
import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { showError } from "@/utils/toast";
import VerseText from './VerseText';
import BookmarkButton from './BookmarkButton';

interface Verse {
  text: string;
  verse: number;
}

interface BookData {
  name: string;
  chapters: number;
  abbreviation: string;
}

interface BibleReaderProps {
  version?: string;
}

const BibleReader: React.FC<BibleReaderProps> = ({ version = "KJV" }) => {
  const [books, setBooks] = useState<BookData[]>([]);
  const [currentBook, setCurrentBook] = useState<string>("Genesis");
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookAbbreviation, setBookAbbreviation] = useState<string>("GEN");

  const chaptersInCurrentBook = books.find(book => book.name === currentBook)?.chapters || 0;

  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch(`https://bible.helloao.org/api/v1/books`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBooks(data.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
      showError("Failed to load Bible books.");
      setError("Failed to load books.");
    }
  }, []);

  const loadChapter = useCallback(async (book: string, chapter: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const bookData = books.find(b => b.name === book);
      if (!bookData) {
        return;
      }
      const abbreviation = bookData.abbreviation;
      
      const response = await fetch(
        `https://bible.helloao.org/api/v1/books/${abbreviation}/chapters/${chapter}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setVerses(data.data.verses);
      setBookAbbreviation(abbreviation);
    } catch (err) {
      console.error(`Failed to load chapter ${chapter} of ${book}:`, err);
      showError(`Failed to load chapter ${chapter} of ${book}.`);
      setError((err as Error).message);
      setVerses([]);
    } finally {
      setIsLoading(false);
    }
  }, [books]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    if (currentBook && currentChapter && books.length > 0) {
      loadChapter(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, books, loadChapter]);

  useEffect(() => {
    const bookData = books.find(b => b.name === currentBook);
    if (bookData) {
      setBookAbbreviation(bookData.abbreviation);
    }
  }, [currentBook, books]);

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(prev => prev - 1);
    } else {
      const currentIndex = books.findIndex(b => b.name === currentBook);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setCurrentBook(prevBook.name);
        setCurrentChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < chaptersInCurrentBook) {
      setCurrentChapter(prev => prev + 1);
    } else {
      const currentIndex = books.findIndex(b => b.name === currentBook);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setCurrentBook(nextBook.name);
        setCurrentChapter(1);
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="text-center relative">
        <div className="flex items-center justify-center mb-2">
          <BookOpen className="h-8 w-8 text-primary mr-2" />
          <CardTitle className="text-2xl font-bold">Bible Reader</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Version: {version}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-center">
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium mb-1 text-left">Book</label>
            <Select value={currentBook} onValueChange={(value) => { setCurrentBook(value); setCurrentChapter(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a book" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.name} value={book.name}>
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium mb-1 text-left">Chapter</label>
            <Select 
              value={String(currentChapter)} 
              onValueChange={(value) => setCurrentChapter(Number(value))}
              disabled={!chaptersInCurrentBook || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: chaptersInCurrentBook }, (_, i) => i + 1).map((chapterNum) => (
                  <SelectItem key={chapterNum} value={String(chapterNum)}>
                    {chapterNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={handlePrevChapter} 
            disabled={isLoading || (currentBook === books[0]?.name && currentChapter === 1)}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentBook} {currentChapter}
          </div>
          <Button 
            onClick={handleNextChapter} 
            disabled={isLoading || (currentBook === books[books.length - 1]?.name && currentChapter === chaptersInCurrentBook)}
            variant="outline"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[50vh] w-full rounded-md border p-4 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading verses...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              <p className="font-medium">Error loading chapter</p>
              <p className="mt-1 text-sm">{error}</p>
              <p className="mt-2 text-sm">Please try again later.</p>
            </div>
          ) : verses.length > 0 ? (
            <div className="text-left text-lg leading-relaxed">
              {verses.map((verse) => (
                <VerseText key={verse.verse}>
                  <sup className="font-bold text-primary mr-2 min-w-[1.5rem] text-sm">{verse.verse}</sup>
                  <span>{verse.text}</span>
                  <BookmarkButton verseId={`${bookAbbreviation}.${currentChapter}.${verse.verse}`} />
                </VerseText>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4">
              No verses found for this chapter.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BibleReader;
import React, { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { showError } from "@/utils/toast";

interface Verse {
  text: string;
  verse: number;
}

interface BookData {
  name: string;
  chapters: number;
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

  const chaptersInCurrentBook = books.find(book => book.name === currentBook)?.chapters || 0;

  // Function to fetch books data
  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch(`https://bible.helloao.org/api/v1/books`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBooks(data.data);
      if (data.data.length > 0 && currentBook === "Genesis") { // Only set if default or not yet set
        setCurrentBook(data.data[0].name);
      }
    } catch (err) {
      console.error("Failed to fetch books:", err);
      showError("Failed to load Bible books.");
      setError("Failed to load books.");
    }
  }, [currentBook]);

  // Function to load chapter verses
  const loadChapter = useCallback(async (book: string, chapter: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://bible.helloao.org/api/v1/books/${book}/chapters/${chapter}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVerses(data.data.verses);
    } catch (err) {
      console.error(`Failed to load chapter ${chapter} of ${book}:`, err);
      showError(`Failed to load chapter ${chapter} of ${book}.`);
      setError(`Failed to load chapter ${chapter} of ${book}.`);
      setVerses([]); // Clear verses on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Effect to load chapter when book or chapter changes
  useEffect(() => {
    if (currentBook && currentChapter) {
      loadChapter(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, loadChapter]);

  // Handlers for navigation
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
    <Card className="w-full max-w-3xl mx-auto my-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Bible Reader ({version})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-center">
          {/* Book Dropdown */}
          <Select value={currentBook} onValueChange={setCurrentBook}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

          {/* Chapter Selector */}
          <Select value={String(currentChapter)} onValueChange={(value) => setCurrentChapter(Number(value))}>
            <SelectTrigger className="w-full sm:w-[100px]">
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

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={handlePrevChapter} 
            disabled={isLoading || (currentBook === books[0]?.name && currentChapter === 1)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous Chapter
          </Button>
          <Button 
            onClick={handleNextChapter} 
            disabled={isLoading || (currentBook === books[books.length - 1]?.name && currentChapter === chaptersInCurrentBook)}
          >
            Next Chapter <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Verse List */}
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading verses...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p>{error}</p>
              <p>Please try again later.</p>
            </div>
          ) : verses.length > 0 ? (
            <div className="text-left text-lg leading-relaxed">
              {verses.map((verse) => (
                <p key={verse.verse} className="mb-2">
                  <span className="font-semibold text-primary-foreground mr-2">{verse.verse}.</span>
                  {verse.text}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No verses found for this chapter.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BibleReader;
import { Button } from "@/components/ui/button";
import { CHAPTER_COUNTS } from "@/data/bible";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChapterSelectorProps {
  book: string;
  value: number;
  onChange: (value: number) => void;
}

const ChapterSelector = ({ book, value, onChange }: ChapterSelectorProps) => {
  const maxChapters = CHAPTER_COUNTS[book] || 50; // Default to 50 if book not found

  const handlePrev = () => {
    onChange(Math.max(1, value - 1));
  };

  const handleNext = () => {
    onChange(Math.min(maxChapters, value + 1));
  };

  return (
    <div className="flex items-center gap-4">
      <Button onClick={handlePrev} disabled={value <= 1} variant="outline">
        <ChevronLeft className="mr-2 h-4 w-4" /> Prev
      </Button>
      <div className="text-center font-medium w-24">
        Chapter {value}
      </div>
      <Button onClick={handleNext} disabled={value >= maxChapters} variant="outline">
        Next <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChapterSelector;
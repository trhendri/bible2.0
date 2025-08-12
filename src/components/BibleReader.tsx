// ... (keep all existing imports)
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Add this interface near the top
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

// Update the BibleReader component
const BibleReader: React.FC<BibleReaderProps> = ({ translation = "KJV" }) => {
  // ... (keep all existing state and methods)

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

  // Update the verse rendering part to include the HighlightToolbar
  return (
    // ... (keep existing Card wrapper)
    {verses.map((verse) => (
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
    ))}
    // ... (rest of the component)
  );
};
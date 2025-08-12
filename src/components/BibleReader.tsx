// ... (keep all existing imports)

// Define colors array at the top level of the file
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'bg-yellow-200' },
  { name: 'Green', value: 'bg-green-200' },
  { name: 'Blue', value: 'bg-blue-200' },
  { name: 'Pink', value: 'bg-pink-200' },
  { name: 'Remove', value: 'bg-transparent' }
];

interface HighlightToolbarProps {
  verseId: string;
  currentColor: string | null;
  onHighlight: (color: string | null) => void;
}

const HighlightToolbar = ({ verseId, currentColor, onHighlight }: HighlightToolbarProps) => {
  const [open, setOpen] = useState(false);

  const handleHighlight = (color: string | null) => {
    onHighlight(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="grid grid-cols-2 gap-2">
          {HIGHLIGHT_COLORS.map((color) => (
            <Button
              key={color.value || 'remove'}
              variant="ghost"
              className={`h-8 w-8 p-0 ${color.value || 'bg-transparent'} ${
                currentColor === color.value ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleHighlight(color.value)}
              aria-label={color.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ... (rest of the BibleReader component remains the same)
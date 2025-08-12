import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BIBLE_BOOKS } from "@/data/bible";

interface BookDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const BookDropdown = ({ value, onChange }: BookDropdownProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Select a book" />
      </SelectTrigger>
      <SelectContent>
        {BIBLE_BOOKS.map((book) => (
          <SelectItem key={book} value={book}>
            {book}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BookDropdown;
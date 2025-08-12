import { useState, useEffect, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/SessionProvider';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

interface BookmarkButtonProps {
  verseId: string;
}

const BookmarkButton = ({ verseId }: BookmarkButtonProps) => {
  const { session, supabase } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  const checkBookmark = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('verse_id', verseId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error;
      }

      if (data) {
        setIsBookmarked(true);
        setBookmarkId(data.id);
      } else {
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    } catch (err) {
      console.error('Error checking bookmark:', err);
      // Do not show a toast here, as it can be noisy on page load
    } finally {
      setIsLoading(false);
    }
  }, [supabase, session, verseId]);

  useEffect(() => {
    checkBookmark();
  }, [checkBookmark]);

  const toggleBookmark = async () => {
    if (!session?.user) {
      showError("You must be logged in to bookmark verses.");
      return;
    }
    setIsLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        // Delete bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId);
        if (error) throw error;
        setIsBookmarked(false);
        setBookmarkId(null);
        showSuccess('Bookmark removed');
      } else {
        // Add bookmark
        const { error: insertError } = await supabase
          .from('bookmarks')
          .insert({ user_id: session.user.id, verse_id: verseId });

        if (insertError) throw insertError;

        // After insert, fetch the new bookmark to confirm and get its ID
        const { data, error: fetchError } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('verse_id', verseId)
          .single();
        
        if (fetchError) throw fetchError;

        if (data) {
          setIsBookmarked(true);
          setBookmarkId(data.id);
          showSuccess('Verse bookmarked');
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      showError('Failed to update bookmark.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleBookmark}
      disabled={isLoading}
      className="ml-2 h-6 w-6"
    >
      <Bookmark
        className={cn(
          'h-4 w-4',
          isBookmarked ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400'
        )}
      />
    </Button>
  );
};

export default BookmarkButton;
import BibleReader from "@/components/BibleReader";
import DailyVerse from "@/components/DailyVerse";
import ReadingProgressTracker from "@/components/ReadingProgressTracker";

const Index = () => {
  return (
    <>
      <DailyVerse />
      <ReadingProgressTracker />
      <BibleReader />
    </>
  );
};

export default Index;
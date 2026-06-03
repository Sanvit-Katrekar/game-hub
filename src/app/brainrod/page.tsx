import BrainRod from "@/components/brainrod/BrainRod";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-8 px-4 bg-white dark:bg-black sm:items-start">
        <BrainRod />
      </main>
    </div>
  );
}

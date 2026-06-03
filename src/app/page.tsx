import Hub from "@/components/Hub";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-between pt-10 px-4 bg-white dark:bg-black sm:items-start">
        <Hub />
      </main>
    </div>
  );
}

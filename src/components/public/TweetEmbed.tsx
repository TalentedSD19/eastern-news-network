import { getTweet } from "react-tweet/api";
import TweetRenderer from "./TweetRenderer";
import { normalizeTweet } from "@/lib/tweet";

export default async function TweetEmbed({ tweetId }: { tweetId: string }) {
  try {
    const raw = await getTweet(tweetId);
    if (!raw) return null;
    return (
      <div className="flex justify-center my-6">
        <TweetRenderer tweet={normalizeTweet(raw)} />
      </div>
    );
  } catch {
    return null;
  }
}

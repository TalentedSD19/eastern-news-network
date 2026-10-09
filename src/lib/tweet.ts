import type { Tweet, TweetBase } from "react-tweet/api";

// react-tweet's enrichTweet iterates entity arrays with for..of but the
// Twitter syndication API sometimes omits empty arrays entirely (undefined
// instead of []). Normalize every TweetBase before handing off to EmbeddedTweet.
function fixEntities<T extends TweetBase>(tweet: T): T {
  const e = tweet.entities ?? ({} as T["entities"]);
  return {
    ...tweet,
    entities: {
      hashtags: e.hashtags ?? [],
      urls: e.urls ?? [],
      user_mentions: e.user_mentions ?? [],
      symbols: e.symbols ?? [],
      ...(e.media ? { media: e.media } : {}),
    },
  };
}

export function normalizeTweet(tweet: Tweet): Tweet {
  const t = fixEntities(tweet);
  return {
    ...t,
    ...(t.quoted_tweet ? { quoted_tweet: fixEntities(t.quoted_tweet) } : {}),
    ...(t.parent ? { parent: fixEntities(t.parent) } : {}),
  };
}

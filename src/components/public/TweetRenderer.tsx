"use client";
import { Component, type ReactNode } from "react";
import { EmbeddedTweet } from "react-tweet";
import type { Tweet } from "react-tweet/api";

class TweetErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

export default function TweetRenderer({ tweet }: { tweet: Tweet }) {
  return (
    <TweetErrorBoundary>
      <EmbeddedTweet tweet={tweet} />
    </TweetErrorBoundary>
  );
}

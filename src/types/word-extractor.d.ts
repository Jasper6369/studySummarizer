declare module "word-extractor" {
  class WordExtractor {
    extract(input: Buffer | string): Promise<{
      getBody(): string;
      getFootnotes(): string;
      getEndnotes(): string;
      getHeaders(options?: { includeFooters?: boolean }): string;
    }>;
  }

  export = WordExtractor;
}

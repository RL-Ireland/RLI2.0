export class JsonStreamParser {
  private buffer = "";
  private depth = 0;
  private inString = false;
  private escaped = false;
  private startIndex = -1;

  push(chunk: string): unknown[] {
    const messages: unknown[] = [];
    this.buffer += chunk;

    for (let index = 0; index < this.buffer.length; index += 1) {
      const char = this.buffer[index];

      if (this.inString) {
        if (this.escaped) {
          this.escaped = false;
        } else if (char === "\\") {
          this.escaped = true;
        } else if (char === "\"") {
          this.inString = false;
        }
        continue;
      }

      if (char === "\"") {
        this.inString = true;
        continue;
      }

      if (char === "{") {
        if (this.depth === 0) {
          this.startIndex = index;
        }
        this.depth += 1;
        continue;
      }

      if (char === "}") {
        this.depth -= 1;
        if (this.depth === 0 && this.startIndex >= 0) {
          const raw = this.buffer.slice(this.startIndex, index + 1);
          messages.push(JSON.parse(raw));
          this.buffer = this.buffer.slice(index + 1);
          index = -1;
          this.startIndex = -1;
        }
      }
    }

    if (this.depth === 0 && this.startIndex < 0) {
      this.buffer = this.buffer.trimStart();
    }

    return messages;
  }
}

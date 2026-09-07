// https://github.com/alex-popov-tech/t3_chatgpt/blob/b58629283adce50ac4e62c6a5485bbbbefb57f40/src/server/openaiChat.ts#L45-L64
  async ask(
    inputContent: string,
    opts?: { history?: Message[]; stream?: boolean },
  ): Promise<
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
    | OpenAI.Chat.Completions.ChatCompletion
  > {
    console.log("openai.ask", { inputContent, opts });
    const input = { role: "user", content: inputContent } as Message;
    const output = await openai.chat.completions.create({
      stream: opts?.stream,
      model: this.model,
      messages: [
        ...(opts?.history ?? []),
        { ...input, content: `${input.content}\n---${this.constraints}\n---` },
      ],
    });
    console.log("openai.ask return", { input, output });
    return output;
  }
